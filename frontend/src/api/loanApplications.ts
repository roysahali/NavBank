import { api } from './client'

export interface LoanApplicationOut {
  id: number
  user_id: number
  account_id: number
  loan_type: string
  amount: number
  tenure_months: number
  purpose: string | null
  monthly_income: number
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  reviewed_by: number | null
  loan_id: number | null
  created_at: string
  updated_at: string | null
  user_name: string | null
  user_email: string | null
  account_number: string | null
  interest_rate: number | null
  emi_amount: number | null
}

export interface LoanApplicationCreate {
  loan_type: string
  amount: number
  tenure_months: number
  purpose: string
  monthly_income: number
  account_id: number
}

export const loanApplicationsApi = {
  apply: (data: LoanApplicationCreate) =>
    api.post<LoanApplicationOut>('/loan-applications', data),

  myApplications: () =>
    api.get<LoanApplicationOut[]>('/loan-applications/my'),

  adminList: (status = 'all') =>
    api.get<LoanApplicationOut[]>(`/loan-applications/admin?status=${status}`),

  adminApprove: (id: number) =>
    api.patch<LoanApplicationOut>(`/loan-applications/admin/${id}/approve`, {}),

  adminReject: (id: number, admin_note?: string) =>
    api.patch<LoanApplicationOut>(`/loan-applications/admin/${id}/reject`, { admin_note }),
}
