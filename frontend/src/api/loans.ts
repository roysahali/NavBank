import { api } from './client'
import type { Loan, EmiScheduleItem } from '../types'

export interface PayEmiPayload {
  loan_id: number
  from_account_id: number
}

export const loansApi = {
  getLoans: () => api.get<Loan[]>('/loans'),
  getLoan: (id: number) => api.get<Loan>(`/loans/${id}`),
  getEmiSchedule: (id: number) =>
    api.get<EmiScheduleItem[]>(`/loans/${id}/emi-schedule`),
  payEmi: ({ loan_id, ...body }: PayEmiPayload) =>
    api.post<{ message: string; outstanding_amount: number; loan_status: string }>(`/loans/${loan_id}/pay-emi`, body),
}
