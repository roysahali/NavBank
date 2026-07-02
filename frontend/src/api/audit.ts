import { api } from './client'

export interface AuditLogEntry {
  id: number
  admin_id: number
  admin_name: string | null
  admin_email: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  summary: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export const auditApi = {
  list: (params?: { skip?: number; limit?: number; action?: string; entity_type?: string }) => {
    const q = new URLSearchParams()
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.action) q.set('action', params.action)
    if (params?.entity_type) q.set('entity_type', params.entity_type)
    const qs = q.toString()
    return api.get<AuditLogEntry[]>(`/admin/audit-logs${qs ? `?${qs}` : ''}`)
  },
}
