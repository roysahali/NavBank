import { api } from './client'
import { getAuthHeader } from './client'
import type { Transaction } from '../types'

export interface ReportParams {
  date_from?: string
  date_to?: string
  account_id?: number
  category?: string
  transaction_type?: string
}

function buildQueryString(params: ReportParams): string {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.append(k, String(v))
  })
  return p.toString()
}

export const reportsApi = {
  getTransactionsReport: (params: ReportParams) => {
    const q = buildQueryString(params)
    return api.get<Transaction[]>(`/reports/transactions${q ? `?${q}` : ''}`)
  },
  getCSVDownloadUrl: (params: ReportParams): string => {
    const q = buildQueryString(params)
    const token = localStorage.getItem('token')
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ''
    return `/api/reports/transactions/csv${q ? `?${q}` : '?'}${tokenParam}`
  },
}

export { getAuthHeader }
