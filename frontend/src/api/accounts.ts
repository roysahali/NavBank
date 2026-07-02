import { api } from './client'
import type { Account, Transaction } from '../types'

export const accountsApi = {
  getMyAccounts: () => api.get<Account[]>('/accounts'),
  getAccount: (id: number) => api.get<Account>(`/accounts/${id}`),
  getAccountTransactions: (id: number) => api.get<Transaction[]>(`/accounts/${id}/transactions`),
  getMiniStatement: (id: number) =>
    api.get<Transaction[]>(`/accounts/${id}/transactions?limit=10`),
}
