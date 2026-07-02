import { api } from './client'
import type { CreditCard, CreditCardTransaction } from '../types'

export interface PayBillPayload {
  card_id: number
  from_account_id: number
  amount: number
}

export const creditCardsApi = {
  getCards: () => api.get<CreditCard[]>('/credit-cards'),
  getCard: (id: number) => api.get<CreditCard>(`/credit-cards/${id}`),
  getCardTransactions: (id: number) =>
    api.get<CreditCardTransaction[]>(`/credit-cards/${id}/transactions`),
  payBill: ({ card_id, ...body }: PayBillPayload) =>
    api.post<CreditCard>(`/credit-cards/${card_id}/pay-bill`, body),
}
