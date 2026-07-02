from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.loan import Loan
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.dashboard import (
    AiInsight,
    DashboardData,
    DashboardSummary,
    MonthlyFlow,
    SpendingCategory,
)
from app.schemas.transaction import TransactionOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    account_ids = [a.id for a in accounts]

    savings_balance = sum(a.balance for a in accounts if a.account_type == "savings")
    current_balance = sum(a.balance for a in accounts if a.account_type == "current")
    total_balance = savings_balance + current_balance

    credit_cards = db.query(CreditCard).filter(CreditCard.user_id == current_user.id).all()
    loans = db.query(Loan).filter(Loan.user_id == current_user.id, Loan.status == "active").all()
    total_outstanding_loans = sum(l.outstanding_amount for l in loans)

    summary = DashboardSummary(
        total_balance=total_balance,
        accounts_count=len(accounts),
        savings_balance=savings_balance,
        current_balance=current_balance,
        total_cards=len(credit_cards),
        active_loans=len(loans),
        total_outstanding_loans=total_outstanding_loans,
    )

    # Spending categories - last 30 days outgoing transactions
    since_30 = datetime.now(timezone.utc) - timedelta(days=30)
    spending_txns = (
        db.query(Transaction)
        .filter(
            Transaction.from_account_id.in_(account_ids),
            Transaction.created_at >= since_30,
            Transaction.transaction_type.in_(["withdrawal", "transfer"]),
        )
        .all()
    )

    category_totals: dict = {}
    for txn in spending_txns:
        cat = txn.category or "other"
        category_totals[cat] = category_totals.get(cat, 0.0) + txn.amount

    total_spend = sum(category_totals.values()) or 1.0
    spending_categories: List[SpendingCategory] = [
        SpendingCategory(
            category=cat,
            amount=round(amt, 2),
            percentage=round(amt / total_spend * 100, 1),
        )
        for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    # Monthly flow - last 6 months
    monthly_flow: List[MonthlyFlow] = []
    now = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        if i > 0:
            next_month_start = (now.replace(day=1) - timedelta(days=30 * (i - 1))).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            next_month_start = now

        month_txns = (
            db.query(Transaction)
            .filter(
                (Transaction.from_account_id.in_(account_ids))
                | (Transaction.to_account_id.in_(account_ids)),
                Transaction.created_at >= month_start,
                Transaction.created_at < next_month_start,
            )
            .all()
        ) if account_ids else []

        inflow = sum(
            t.amount for t in month_txns
            if t.to_account_id in account_ids and t.transaction_type in ("deposit", "transfer")
        )
        outflow = sum(
            t.amount for t in month_txns
            if t.from_account_id in account_ids and t.transaction_type in ("withdrawal", "transfer")
        )

        monthly_flow.append(
            MonthlyFlow(
                month=month_start.strftime("%b %Y"),
                inflow=round(inflow, 2),
                outflow=round(outflow, 2),
            )
        )

    # Rule-based insights
    insights: List[AiInsight] = []

    if spending_categories:
        top_cat = spending_categories[0]
        insights.append(
            AiInsight(
                title=f"Top spending: {top_cat.category.title()}",
                message=f"You spent ₹{top_cat.amount:,.0f} on {top_cat.category} in the last 30 days ({top_cat.percentage}% of total spend).",
                type="info",
            )
        )

    # Check savings ratio
    if monthly_flow:
        last_month = monthly_flow[-1]
        if last_month.inflow > 0:
            savings_ratio = (last_month.inflow - last_month.outflow) / last_month.inflow * 100
            if savings_ratio < 10:
                insights.append(
                    AiInsight(
                        title="Low savings rate",
                        message=f"Your savings rate this month is {savings_ratio:.1f}%. Financial experts recommend saving at least 20% of your income.",
                        type="warning",
                    )
                )
            elif savings_ratio >= 30:
                insights.append(
                    AiInsight(
                        title="Excellent savings rate!",
                        message=f"You saved {savings_ratio:.1f}% of your income this month. Keep it up!",
                        type="success",
                    )
                )

    if loans:
        insights.append(
            AiInsight(
                title="Loan due reminder",
                message=f"You have {len(loans)} active loan(s) with total outstanding of ₹{total_outstanding_loans:,.0f}. Ensure timely EMI payments to maintain your credit score.",
                type="warning",
            )
        )

    for card in credit_cards:
        utilization = (card.outstanding_amount / card.credit_limit * 100) if card.credit_limit > 0 else 0
        if utilization > 80:
            insights.append(
                AiInsight(
                    title="High credit utilization",
                    message=f"Your {card.card_type} card is at {utilization:.0f}% utilization. Keep it below 30% for a better credit score.",
                    type="warning",
                )
            )

    if not insights:
        insights.append(
            AiInsight(
                title="All good!",
                message="Your finances look healthy. Keep tracking your spending to stay on top of your goals.",
                type="success",
            )
        )

    # Recent transactions
    recent_txns = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids))
            | (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    ) if account_ids else []

    recent_transactions = [TransactionOut.model_validate(t) for t in recent_txns]

    return DashboardData(
        summary=summary,
        spending_categories=spending_categories,
        monthly_flow=monthly_flow,
        insights=insights,
        recent_transactions=recent_transactions,
    )
