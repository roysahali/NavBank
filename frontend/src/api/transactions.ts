import { api } from './client'
import type { Transaction } from '../types'

export interface TransactionFilters {
  date_from?: string
  date_to?: string
  transaction_type?: string
  category?: string
  account_id?: number
  limit?: number
  skip?: number
}

export const transactionsApi = {
  getMyTransactions: (filters?: TransactionFilters) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.append(k, String(v))
      })
    }
    const query = params.toString()
    return api.get<Transaction[]>(`/transactions${query ? `?${query}` : ''}`)
  },
  transfer: (data: {
    from_account_id: number
    to_account_number: string
    amount: number
    description: string
    transfer_mode?: string
  }) => api.post<Transaction>('/transactions/transfer', data),
  deposit: (data: { account_id: number; amount: number; description: string }) =>
    api.post<Transaction>('/transactions/deposit', data),
  withdraw: (data: { account_id: number; amount: number; description: string }) =>
    api.post<Transaction>('/transactions/withdraw', data),
}
