from typing import List

from pydantic import BaseModel

from app.schemas.transaction import TransactionOut


class DashboardSummary(BaseModel):
    total_balance: float
    accounts_count: int
    savings_balance: float
    current_balance: float
    total_cards: int
    active_loans: int
    total_outstanding_loans: float


class SpendingCategory(BaseModel):
    category: str
    amount: float
    percentage: float


class MonthlyFlow(BaseModel):
    month: str
    inflow: float
    outflow: float


class AiInsight(BaseModel):
    title: str
    message: str
    type: str  # info | warning | success | tip


class DashboardData(BaseModel):
    summary: DashboardSummary
    spending_categories: List[SpendingCategory]
    monthly_flow: List[MonthlyFlow]
    insights: List[AiInsight]
    recent_transactions: List[TransactionOut]
