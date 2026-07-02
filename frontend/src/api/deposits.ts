import { api } from './client'

export interface Denominations {
  notes_100: number
  notes_200: number
  notes_500: number
}

export interface DepositRequestOut {
  id: number
  user_id: number
  account_id: number
  amount: number
  denominations: Record<string, number> | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  reviewed_by: number | null
  created_at: string
  updated_at: string | null
  user_name: string | null
  user_email: string | null
  account_number: string | null
}

export const depositsApi = {
  createRequest: (account_id: number, denominations: Denominations) =>
    api.post<DepositRequestOut>('/deposits', { account_id, denominations }),

  myRequests: () =>
    api.get<DepositRequestOut[]>('/deposits/my'),

  // Admin
  adminList: (status = 'all') =>
    api.get<DepositRequestOut[]>(`/deposits/admin?status=${status}`),

  adminApprove: (id: number) =>
    api.patch<DepositRequestOut>(`/deposits/admin/${id}/approve`, {}),

  adminReject: (id: number, admin_note?: string) =>
    api.patch<DepositRequestOut>(`/deposits/admin/${id}/reject`, { admin_note }),
}
