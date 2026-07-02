import { api } from './client'
import type { DashboardSummary, SpendingCategory, MonthlyFlow, AiInsight, Transaction } from '../types'

export interface DashboardData {
  summary: DashboardSummary
  spending_by_category: SpendingCategory[]
  monthly_flow: MonthlyFlow[]
  ai_insights: AiInsight[]
  recent_transactions: Transaction[]
}

export const dashboardApi = {
  getDashboard: () => api.get<DashboardData>('/dashboard'),
}
