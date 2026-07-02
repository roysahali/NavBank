import { api } from './client'
import type { SupportTicket, SupportTicketDetail, SupportMessage } from '../types'

export interface CreateTicketPayload {
  subject: string
  category: string
  priority: string
  message: string
}

export const supportApi = {
  createTicket: (data: CreateTicketPayload) => api.post<SupportTicketDetail>('/support', data),
  getTickets: () => api.get<SupportTicket[]>('/support'),
  getTicket: (id: number) => api.get<SupportTicketDetail>(`/support/${id}`),
  reply: (ticketId: number, message: string) =>
    api.post<SupportMessage>(`/support/${ticketId}/reply`, { message }),
  // Admin
  adminGetTicket: (id: number) => api.get<SupportTicketDetail>(`/support/admin/tickets/${id}`),
  adminGetTickets: () => api.get<SupportTicket[]>('/support/admin/tickets'),
  adminUpdateStatus: (ticketId: number, status: string) =>
    api.patch<SupportTicketDetail>(`/support/admin/tickets/${ticketId}/status`, { status }),
  adminReply: (ticketId: number, message: string) =>
    api.post<SupportMessage>(`/support/admin/tickets/${ticketId}/reply`, { message }),
}
