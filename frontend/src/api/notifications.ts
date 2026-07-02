import { api } from './client'
import type { Notification } from '../types'

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => api.patch<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ message: string }>('/notifications/read-all'),
  delete: (id: number) => api.delete<{ message: string }>(`/notifications/${id}`),
}
