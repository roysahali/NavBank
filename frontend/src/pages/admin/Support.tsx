import { useEffect, useState } from 'react'
import { Headphones, MessageCircle, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { supportApi } from '../../api/support'
import { formatDateTime } from '../../utils/formatters'
import type { SupportTicket, SupportTicketDetail, SupportMessage } from '../../types'

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
}

const PRIORITY_STYLE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-600',
}

const ALL_STATUSES = ['open', 'in_progress', 'resolved', 'closed']

function AdminTicketModal({ ticket, isOpen, onClose, onTicketUpdated }: {
  ticket: SupportTicketDetail | null
  isOpen: boolean
  onClose: () => void
  onTicketUpdated: (updated: Partial<SupportTicket> & { id: number }) => void
}) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages)
      setNewStatus(ticket.status)
    }
  }, [ticket])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !ticket) return
    setSending(true)
    try {
      const newMsg = await supportApi.adminReply(ticket.id, reply.trim())
      setMessages((prev) => [...prev, newMsg])
      setReply('')
      toast.success('Reply sent')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  async function handleStatusUpdate() {
    if (!ticket || newStatus === ticket.status) return
    setUpdatingStatus(true)
    try {
      await supportApi.adminUpdateStatus(ticket.id, newStatus)
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      onTicketUpdated({ id: ticket.id, status: newStatus })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (!ticket) return null
  const isClosed = ticket.status === 'closed'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${ticket.ticket_number} — ${ticket.subject}`} size="lg">
      <div className="flex flex-col h-[72vh]">
        {/* Status bar + admin controls */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-wrap">
          <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLE[ticket.status] ?? 'bg-gray-100')}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', PRIORITY_STYLE[ticket.priority] ?? 'bg-gray-100')}>
            {ticket.priority} priority
          </span>
          <span className="text-xs text-gray-400 capitalize">{ticket.category}</span>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || newStatus === ticket.status}
              className="text-xs px-3 py-1.5 bg-novbank-700 text-white rounded-lg hover:bg-novbank-800 disabled:opacity-40 transition-colors"
            >
              {updatingStatus ? '…' : 'Update'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={clsx('flex gap-3', msg.is_admin_reply ? 'flex-row-reverse' : 'flex-row')}>
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                msg.is_admin_reply ? 'bg-novbank-800 text-white' : 'bg-blue-100 text-blue-700'
              )}>
                {msg.is_admin_reply ? 'S' : msg.sender_name.charAt(0).toUpperCase()}
              </div>
              <div className={clsx('max-w-[75%] flex flex-col gap-1', msg.is_admin_reply ? 'items-end' : 'items-start')}>
                <span className="text-xs text-gray-400">
                  {msg.is_admin_reply ? 'You (Support Agent)' : msg.sender_name} · {formatDateTime(msg.created_at)}
                </span>
                <div className={clsx(
                  'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  msg.is_admin_reply
                    ? 'bg-novbank-700 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                )}>
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply */}
        <div className="border-t border-gray-100 px-6 py-4">
          {isClosed ? (
            <p className="text-sm text-center text-gray-400">This ticket is closed. Update status to reply.</p>
          ) : (
            <form onSubmit={handleReply} className="flex gap-3">
              <textarea
                className="input flex-1 resize-none py-2.5 text-sm"
                rows={2}
                placeholder="Type your response…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e as unknown as React.FormEvent) } }}
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="btn-primary px-4 py-2 self-end disabled:opacity-50 flex items-center gap-2">
                <Send size={15} />
                {sending ? '…' : 'Reply'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SupportTicketDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supportApi.adminGetTickets()
      .then(setTickets)
      .catch(() => toast.error('Failed to load support tickets'))
      .finally(() => setLoading(false))
  }, [])

  async function openTicket(ticket: SupportTicket) {
    setDetailOpen(true)
    try {
      const detail = await supportApi.adminGetTicket(ticket.id)
      setSelected(detail)
    } catch {
      toast.error('Failed to load ticket')
      setDetailOpen(false)
    }
  }

  function handleTicketUpdated(updated: Partial<SupportTicket> & { id: number }) {
    setTickets((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t))
    if (selected && selected.id === updated.id) {
      setSelected((prev) => prev ? { ...prev, ...updated } : prev)
    }
  }

  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const filtered = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter)

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
              <Headphones size={20} className="text-novbank-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-500 text-sm">{tickets.length} total tickets</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Summary cards */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Open', count: counts.open, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Progress', count: counts.in_progress, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Resolved', count: counts.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((s) => (
              <div key={s.label} className={clsx('card flex items-center gap-4', s.bg, 'border-0')}>
                <MessageCircle size={24} className={s.color} />
                <div>
                  <div className={clsx('text-2xl font-bold', s.color)}>{s.count}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Filter tabs */}
        <ScrollReveal delay={0.06}>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                  statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : (
          <ScrollReveal delay={0.08}>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Ticket', 'Subject', 'Category', 'Priority', 'Status', 'Updated', 'Action'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-sm text-gray-400 py-10">No tickets found</td>
                      </tr>
                    ) : filtered.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{ticket.ticket_number}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.subject}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{ticket.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', PRIORITY_STYLE[ticket.priority])}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-medium capitalize', STATUS_STYLE[ticket.status] ?? 'bg-gray-100')}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatDateTime(ticket.updated_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openTicket(ticket)}
                            className="text-xs font-medium px-3 py-1.5 bg-novbank-50 text-novbank-700 hover:bg-novbank-100 rounded-lg transition-colors">
                            View & Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      <AdminTicketModal
        ticket={selected}
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null) }}
        onTicketUpdated={handleTicketUpdated}
      />
    </BankingLayout>
  )
}
