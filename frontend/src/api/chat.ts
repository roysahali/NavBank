import { api } from './client'

export interface ChatMessageOut {
  id: number
  session_id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSessionOut {
  id: number
  user_id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatSessionDetail extends ChatSessionOut {
  messages: ChatMessageOut[]
}

export const chatApi = {
  createSession: () => api.post<ChatSessionDetail>('/chat/sessions'),
  listSessions: () => api.get<ChatSessionOut[]>('/chat/sessions'),
  getSession: (id: number) => api.get<ChatSessionDetail>(`/chat/sessions/${id}`),
  sendMessage: (sessionId: number, content: string) =>
    api.post<ChatMessageOut>(`/chat/sessions/${sessionId}/message`, { content }),
  deleteSession: (id: number) => api.delete<void>(`/chat/sessions/${id}`),
}
