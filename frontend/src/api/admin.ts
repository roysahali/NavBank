import { api } from './client'
import type { AccountWithOwner, AdminStats, Transaction, User } from '../types'

export interface AdminCreateUserPayload {
  email: string
  full_name: string
  password: string
  mobile: string
  role: string
  kyc_status: string
  create_account: boolean
}

export interface AdminUpdateUserPayload {
  full_name?: string
  email?: string
  mobile?: string
  kyc_status?: string
  password?: string
}

export interface UserSearchResult {
  id: number
  full_name: string
  email: string
  mobile: string
  kyc_status: string
  is_active: boolean
  created_at: string | null
}

export interface ProfileAccount {
  id: number
  account_number: string
  account_type: string
  balance: number
  status: string
  ifsc_code: string
  branch_name: string
  interest_rate: number
  created_at: string | null
}

export interface ProfileTransaction {
  id: number
  transaction_type: string
  amount: number
  status: string
  description: string
  from_account_id: number | null
  to_account_id: number | null
  created_at: string | null
}

export interface ProfileUpiVpa {
  id: number
  vpa: string
  linked_account_id: number
  is_primary: boolean
  created_at: string | null
}

export interface ProfileUpiTxn {
  id: number
  sender_vpa: string
  receiver_vpa: string
  amount: number
  status: string
  note: string | null
  created_at: string | null
}

export interface ProfileCard {
  id: number
  card_number: string
  card_type: string
  card_variant: string
  credit_limit: number
  outstanding_amount: number
  available_limit: number
  status: string
  expiry_month: number
  expiry_year: number
  reward_points: number
  created_at: string | null
}

export interface ProfileLoan {
  id: number
  loan_type: string
  principal_amount: number
  outstanding_amount: number
  interest_rate: number
  tenure_months: number
  emi_amount: number
  status: string
  created_at: string | null
}

export interface ProfileLoanApp {
  id: number
  loan_type: string
  amount: number
  tenure_months: number
  purpose: string
  monthly_income: number
  status: string
  admin_note: string | null
  created_at: string | null
}

export interface ProfileDeposit {
  id: number
  amount: number
  status: string
  created_at: string | null
}

export interface ProfileNotification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string | null
}

export interface UserFullProfile {
  user: {
    id: number
    full_name: string
    email: string
    mobile: string
    role: string
    kyc_status: string
    is_active: boolean
    created_at: string | null
  }
  accounts: ProfileAccount[]
  transactions: ProfileTransaction[]
  upi_vpas: ProfileUpiVpa[]
  upi_transactions: ProfileUpiTxn[]
  credit_cards: ProfileCard[]
  loans: ProfileLoan[]
  loan_applications: ProfileLoanApp[]
  deposit_requests: ProfileDeposit[]
  notifications: ProfileNotification[]
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  getUsers: () => api.get<User[]>('/admin/users'),
  searchUsers: (q: string) => api.get<UserSearchResult[]>(`/admin/users/search?q=${encodeURIComponent(q)}`),
  getUserFullProfile: (id: number) => api.get<UserFullProfile>(`/admin/users/${id}/full-profile`),
  createUser: (data: AdminCreateUserPayload) => api.post<User>('/admin/users', data),
  updateUser: (id: number, data: AdminUpdateUserPayload) => api.patch<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete<{ message: string }>(`/admin/users/${id}`),
  toggleUserActive: (userId: number) => api.patch<User>(`/admin/users/${userId}/toggle-active`),
  getAccounts: () => api.get<AccountWithOwner[]>('/admin/accounts'),
  createAccount: (data: { user_id: number; account_type: string; initial_balance: number }) =>
    api.post<AccountWithOwner>('/admin/accounts', data),
  freezeAccount: (id: number) => api.patch(`/admin/accounts/${id}/freeze`),
  unfreezeAccount: (id: number) => api.patch(`/admin/accounts/${id}/unfreeze`),
  blockCard: (id: number) => api.patch(`/admin/credit-cards/${id}/block`),
  deposit: (data: { account_id: number; amount: number; description: string }) =>
    api.post<Transaction>('/admin/deposit', data),
  getTransactions: () => api.get<Transaction[]>('/admin/transactions'),
}
