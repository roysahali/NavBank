import { api } from './client'
import type { Beneficiary } from '../types'

export interface AddBeneficiaryPayload {
  name: string
  account_number: string
  ifsc_code: string
  bank_name: string
  alias?: string
}

export const beneficiariesApi = {
  getBeneficiaries: () => api.get<Beneficiary[]>('/beneficiaries'),
  addBeneficiary: (data: AddBeneficiaryPayload) =>
    api.post<Beneficiary>('/beneficiaries', data),
  deleteBeneficiary: (id: number) =>
    api.delete<{ message: string }>(`/beneficiaries/${id}`),
}
