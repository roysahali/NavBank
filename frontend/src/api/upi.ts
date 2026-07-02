import { api } from './client'
import type { UpiVpa, UpiTransaction } from '../types'

export interface CreateVpaPayload {
  vpa: string
  linked_account_id: number
}

export interface UpiPayPayload {
  sender_vpa: string
  receiver_vpa: string
  amount: number
  note?: string
  mpin?: string
}

export interface ResolveVpaResponse {
  vpa: string
  name: string
}

export const upiApi = {
  getVPAs: () => api.get<UpiVpa[]>('/upi/vpas'),
  createVPA: (data: CreateVpaPayload) => api.post<UpiVpa>('/upi/vpas', data),
  deleteVPA: (id: number) => api.delete<{ message: string }>(`/upi/vpas/${id}`),
  payUPI: (data: UpiPayPayload) => api.post<UpiTransaction>('/upi/pay', data),
  getUPITransactions: () => api.get<UpiTransaction[]>('/upi/transactions'),
  resolveVPA: (vpa: string) =>
    api.get<ResolveVpaResponse>(`/upi/resolve/${encodeURIComponent(vpa)}`),
}
