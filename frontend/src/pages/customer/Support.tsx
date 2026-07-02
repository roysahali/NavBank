import { useEffect, useState } from 'react'
import { Headphones, PlusCircle, MessageCircle, Clock, ChevronRight, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { supportApi } from '../../api/support'
import type { CreateTicketPayload } from '../../api/support'
import { formatDateTime } from '../../utils/formatters'
import type { SupportTicket, SupportTicketDetail, SupportMessage } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

const CATEGORIES = ['account', 'card', 'loan', 'upi', 'transfer', 'other']
const PRIORITIES = ['low', 'medium', 'high']

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

function NewTicketModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean; onClose: () => void; onCreated: (t: SupportTicketDetail) => void
}) {
  const [form, setForm] = useState<CreateTicketPayload>({ subject: '', category: 'other', priority: 'medium', message: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Subject and message are required'); return }
    setSaving(true)
    try {
      const ticket = await supportApi.createTicket(form)
      toast.success(`Ticket ${ticket.ticket_number} created`)
      onCreated(ticket)
      setForm({ subject: '', category: 'other', priority: 'medium', message: '' })
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Support Ticket" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
          <input className="input w-full" placeholder="Briefly describe your issue" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select className="input w-full capitalize" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select className="input w-full capitalize" value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
          <textarea className="input w-full resize-none" rows={5} placeholder="Describe your issue in detail..."
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TicketDetailModal({ ticket, isOpen, onClose }: {
  ticket: SupportTicketDetail | null; isOpen: boolean; onClose: () => void
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const isClosed = ticket?.status === 'closed'

  useEffect(() => {
    if (ticket) setMessages(ticket.messages)
  }, [ticket])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !ticket) return
    setSending(true)
    try {
      const newMsg = await supportApi.reply(ticket.id, reply.trim())
      setMessages((prev) => [...prev, newMsg])
      setReply('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (!ticket) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${ticket.ticket_number} — ${ticket.subject}`} size="lg">
      <div className="flex flex-col h-[70vh]">
        {/* Status bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-wrap">
          <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLE[ticket.status] ?? 'bg-gray-100')}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', PRIORITY_STYLE[ticket.priority] ?? 'bg-gray-100')}>
            {ticket.priority} priority
          </span>
          <span className="text-xs text-gray-400 capitalize">{ticket.category}</span>
          <span className="ml-auto text-xs text-gray-400">Opened {formatDateTime(ticket.created_at)}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={clsx('flex gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  msg.is_admin_reply ? 'bg-novbank-800 text-white' : 'bg-blue-100 text-blue-700'
                )}>
                  {msg.is_admin_reply ? 'S' : msg.sender_name.charAt(0).toUpperCase()}
                </div>
                <div className={clsx('max-w-[75%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                  <span className="text-xs text-gray-400">
                    {msg.is_admin_reply ? 'Support Agent' : msg.sender_name} · {formatDateTime(msg.created_at)}
                  </span>
                  <div className={clsx(
                    'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-novbank-700 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  )}>
                    {msg.message}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reply bar */}
        <div className="border-t border-gray-100 px-6 py-4">
          {isClosed ? (
            <p className="text-sm text-center text-gray-400">This ticket is closed.</p>
          ) : (
            <form onSubmit={handleReply} className="flex gap-3">
              <textarea
                className="input flex-1 resize-none py-2.5 text-sm"
                rows={2}
                placeholder="Type your reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e as unknown as React.FormEvent) } }}
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="btn-primary px-4 py-2 self-end disabled:opacity-50 flex items-center gap-2">
                <Send size={15} />
                {sending ? '…' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [newOpen, setNewOpen] = useState(false)
  const [selected, setSelected] = useState<SupportTicketDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    supportApi.getTickets()
      .then(setTickets)
      .catch(() => toast.error('Failed to load tickets'))
      .finally(() => setLoading(false))
  }, [])

  async function openTicket(ticket: SupportTicket) {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const detail = await supportApi.getTicket(ticket.id)
      setSelected(detail)
    } catch {
      toast.error('Failed to load ticket details')
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
                <Headphones size={20} className="text-novbank-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Support</h1>
                <p className="text-gray-500 text-sm">
                  {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length} active tickets
                </p>
              </div>
            </div>
            <button onClick={() => setNewOpen(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
              <PlusCircle size={16} />
              New Ticket
            </button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : tickets.length === 0 ? (
          <ScrollReveal>
            <div className="card text-center py-16">
              <Headphones size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">No support tickets yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">Raise a ticket and our team will respond within 24 hours</p>
              <button onClick={() => setNewOpen(true)} className="btn-primary text-sm inline-flex items-center gap-2">
                <PlusCircle size={15} /> New Ticket
              </button>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket, i) => (
              <ScrollReveal key={ticket.id} delay={i * 0.04}>
                <button
                  onClick={() => openTicket(ticket)}
                  className="w-full card text-left hover:shadow-md transition-all hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-novbank-50 flex items-center justify-center shrink-0 group-hover:bg-novbank-100 transition-colors">
                      <MessageCircle size={18} className="text-novbank-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-xs font-mono text-gray-400 mr-2">{ticket.ticket_number}</span>
                          <span className="text-sm font-semibold text-gray-900">{ticket.subject}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLE[ticket.status] ?? 'bg-gray-100')}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PRIORITY_STYLE[ticket.priority] ?? 'bg-gray-100')}>
                          {ticket.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 capitalize">{ticket.category}</span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                          <MessageCircle size={11} /> {ticket.message_count}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {formatDateTime(ticket.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <NewTicketModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(t) => setTickets((prev) => [t, ...prev])}
      />
      <TicketDetailModal
        ticket={loadingDetail ? null : selected}
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null) }}
      />
    </BankingLayout>
  )
}
