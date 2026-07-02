from __future__ import annotations

import re
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.account import Account
from app.models.credit_card import CreditCard
from app.models.loan import Loan
from app.models.transaction import Transaction
from app.models.user import User


def _build_context(user: User, db: Session) -> str:
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    account_ids = [a.id for a in accounts]

    txns = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids))
            | (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    loans = db.query(Loan).filter(Loan.user_id == user.id, Loan.status == "active").all()
    cards = db.query(CreditCard).filter(CreditCard.user_id == user.id, CreditCard.status == "active").all()

    lines = [
        f"Customer: {user.full_name} | Mobile: {user.mobile} | KYC: {user.kyc_status}",
        "",
        "ACCOUNTS:",
    ]
    total = 0.0
    for acc in accounts:
        lines.append(
            f"  • {acc.account_type.capitalize()} {acc.account_number}: "
            f"₹{acc.balance:,.2f} [{acc.status}] IFSC: {acc.ifsc_code}"
        )
        total += acc.balance
    lines.append(f"  Total balance: ₹{total:,.2f}")

    lines += ["", "RECENT TRANSACTIONS (last 5):"]
    for txn in txns:
        credit = txn.to_account_id in account_ids and txn.from_account_id not in account_ids
        sign = "+" if credit else "-"
        lines.append(
            f"  • {txn.created_at.strftime('%d %b')} | {txn.description[:40]} | "
            f"{sign}₹{txn.amount:,.0f} | {txn.category or txn.transaction_type}"
        )

    if loans:
        lines += ["", "ACTIVE LOANS:"]
        for loan in loans:
            lines.append(
                f"  • {loan.loan_type.capitalize()} {loan.loan_number}: "
                f"Outstanding ₹{loan.outstanding_amount:,.2f} | EMI ₹{loan.emi_amount:,.2f} | "
                f"Rate {loan.interest_rate}% | Next due {loan.next_due_date}"
            )

    if cards:
        lines += ["", "CREDIT CARDS:"]
        for card in cards:
            lines.append(
                f"  • {card.card_type} {card.card_variant} {card.card_number}: "
                f"Outstanding ₹{card.outstanding_amount:,.2f} | Limit ₹{card.credit_limit:,.2f} | "
                f"Min due ₹{card.minimum_due:,.2f} | Due day {card.due_date_day}"
            )

    return "\n".join(lines)


_SYSTEM_PROMPT = """You are Nova, NovBank's intelligent AI banking assistant. You are conversational, empathetic, and always helpful.

You have access to the customer's real-time account data shown below. Use it to give accurate, personalised answers.

{context}

CAPABILITIES:
- Answer balance and account queries with exact figures
- Explain recent transactions and spending patterns
- Give EMI and loan details
- Calculate EMI for new loans: EMI = P * r * (1+r)^n / ((1+r)^n - 1) where r = annual_rate/12/100
- Credit card outstanding, due dates, minimum payment
- Guide users to app sections (e.g., "Go to Transfer > NEFT tab")
- Detect financial stress and offer tips
- Answer general banking FAQs (NEFT/RTGS/IMPS limits, UPI rules, etc.)

RULES:
- Always use ₹ and Indian numbering (1,24,500 not 124,500)
- Be concise — 2-4 sentences unless detail is needed
- Never ask for passwords or full card numbers
- If unsure, suggest contacting support at /support
- Use friendly tone, avoid banking jargon unless explaining it"""


def _rule_based_response(msg: str, user: User, db: Session) -> str:
    """Smart fallback when no API key is configured."""
    msg_l = msg.lower().strip()

    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    total = sum(a.balance for a in accounts)

    if any(w in msg_l for w in ["balance", "how much", "money", "funds"]):
        parts = [f"Your total balance is ₹{total:,.2f}."]
        for acc in accounts:
            parts.append(f"{acc.account_type.capitalize()} ({acc.account_number[-4:]}): ₹{acc.balance:,.2f}")
        return " ".join(parts)

    if any(w in msg_l for w in ["transaction", "history", "spent", "last", "recent"]):
        account_ids = [a.id for a in accounts]
        txns = (
            db.query(Transaction)
            .filter(
                (Transaction.from_account_id.in_(account_ids))
                | (Transaction.to_account_id.in_(account_ids))
            )
            .order_by(Transaction.created_at.desc())
            .limit(5)
            .all()
        )
        if not txns:
            return "You have no recent transactions."
        lines = ["Your last 5 transactions:"]
        for t in txns:
            credit = t.to_account_id in account_ids and t.from_account_id not in account_ids
            lines.append(f"• {t.description}: {'+'if credit else '-'}₹{t.amount:,.0f} on {t.created_at.strftime('%d %b')}")
        return "\n".join(lines)

    if any(w in msg_l for w in ["loan", "emi", "home loan", "personal loan", "auto loan"]):
        loans = db.query(Loan).filter(Loan.user_id == user.id, Loan.status == "active").all()
        if not loans:
            return "You have no active loans. Visit the Loans section to apply."
        lines = ["Your active loans:"]
        for loan in loans:
            lines.append(
                f"• {loan.loan_type.capitalize()} Loan {loan.loan_number}: "
                f"Outstanding ₹{loan.outstanding_amount:,.2f} | EMI ₹{loan.emi_amount:,.2f} | Next due {loan.next_due_date}"
            )
        return "\n".join(lines)

    if any(w in msg_l for w in ["credit card", "card", "outstanding", "bill", "due"]):
        cards = db.query(CreditCard).filter(CreditCard.user_id == user.id, CreditCard.status == "active").all()
        if not cards:
            return "You have no active credit cards."
        lines = ["Your credit cards:"]
        for card in cards:
            lines.append(
                f"• {card.card_type} {card.card_variant}: Outstanding ₹{card.outstanding_amount:,.2f} | "
                f"Available ₹{card.available_limit:,.2f} | Min due ₹{card.minimum_due:,.2f}"
            )
        return "\n".join(lines)

    # EMI calculator
    emi_match = re.search(r"(\d[\d,]*)\s*(?:lakh|lac|l)?.*?(\d+(?:\.\d+)?)\s*%.*?(\d+)\s*(?:year|yr|month|mo)", msg_l)
    if emi_match or "calculate" in msg_l:
        return (
            "I can calculate EMI! Please provide: loan amount, interest rate, and tenure. "
            "Example: 'Calculate EMI for 10 lakh at 8.5% for 20 years'"
        )

    if any(w in msg_l for w in ["transfer", "neft", "rtgs", "imps", "send money"]):
        return (
            "To transfer money, go to the **Transfer** section. "
            "IMPS is instant (up to ₹5L), NEFT processes in batches, RTGS is for amounts ≥ ₹2L. "
            "You can save beneficiaries for quick transfers."
        )

    if any(w in msg_l for w in ["upi", "pay", "qr"]):
        return "For UPI payments, visit the **UPI** section. You can pay to any UPI ID (e.g., name@bank) and check your transaction history there."

    if any(w in msg_l for w in ["hello", "hi", "hey", "good morning", "good evening"]):
        return f"Hello {user.full_name.split()[0]}! 👋 I'm Nova, your NovBank assistant. I can help with your balance, transactions, loans, credit cards, and more. What can I do for you today?"

    if any(w in msg_l for w in ["help", "what can you do", "features"]):
        return (
            "I can help you with:\n"
            "• 💰 Account balances\n"
            "• 📋 Recent transactions\n"
            "• 🏠 Loan & EMI details\n"
            "• 💳 Credit card info\n"
            "• 🔄 Transfer guidance (NEFT/RTGS/IMPS/UPI)\n"
            "• 🧮 EMI calculations\n"
            "• ❓ General banking FAQs\n\n"
            "Just ask in plain English!"
        )

    return (
        f"I understand you're asking about '{msg[:50]}'. "
        "For detailed assistance, please visit the relevant section in the app or raise a support ticket. "
        "I can help with balances, transactions, loans, cards, and transfers!"
    )


def get_ai_response(
    user: User,
    db: Session,
    history: list[dict],
    user_message: str,
) -> str:
    if not settings.anthropic_api_key:
        return _rule_based_response(user_message, user, db)

    try:
        import anthropic  # type: ignore

        context = _build_context(user, db)
        system = _SYSTEM_PROMPT.format(context=context)

        messages = []
        for m in history[-12:]:
            messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": user_message})

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=1024,
            system=system,
            messages=messages,
        )
        return response.content[0].text

    except Exception:
        return _rule_based_response(user_message, user, db)
