import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  X,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonLine } from '../../components/ui/Skeleton'
import { notificationsApi } from '../../api/notifications'
import { useNotifications } from '../../contexts/NotificationContext'
import { formatDateTime } from '../../utils/formatters'
import type { Notification } from '../../types'

type Tab = 'all' | 'unread'

const TYPE_CONFIG = {
  info: {
    icon: <Info size={18} />,
    bg: 'bg-blue-50',
    text: 'text-blue-500',
  },
  success: {
    icon: <CheckCircle2 size={18} />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-500',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-amber-50',
    text: 'text-amber-500',
  },
  alert: {
    icon: <BellRing size={18} />,
    bg: 'bg-red-50',
    text: 'text-red-500',
  },
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
      <div className="relative overflow-hidden w-10 h-10 rounded-xl bg-gray-100 shrink-0">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <SkeletonLine className="h-4" width="50%" />
        <SkeletonLine className="h-3" width="80%" />
        <SkeletonLine className="h-3" width="30%" />
      </div>
    </div>
  )
}

function NotificationDetailModal({
  notif,
  onClose,
  onNavigate,
}: {
  notif: Notification
  onClose: () => void
  onNavigate: (url: string) => void
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
  const LARGE_ICON: Record<string, React.ReactNode> = {
    info: <Info size={28} />,
    success: <CheckCircle2 size={28} />,
    warning: <AlertTriangle size={28} />,
    alert: <BellRing size={28} />,
  }
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header strip */}
          <div className={clsx('px-6 py-5 flex items-start gap-4', cfg.bg)}>
            <div className={clsx('w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center shrink-0', cfg.text)}>
              {LARGE_ICON[notif.type] ?? LARGE_ICON.info}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className={clsx('font-bold text-base leading-tight', cfg.text)}>{notif.title}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDateTime(notif.created_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-sm text-gray-700 leading-relaxed">{notif.message}</p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Close
            </button>
            {notif.related_url && (
              <button
                onClick={() => onNavigate(notif.related_url!)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-novbank-800 text-white rounded-xl hover:bg-novbank-700 transition-colors"
              >
                <ExternalLink size={14} />
                Go to page
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Notification | null>(null)
  const navigate = useNavigate()
  const { decrement, resetToZero } = useNotifications()

  function load(unreadOnly = false) {
    setLoading(true)
    notificationsApi
      .list(unreadOnly)
      .then(setNotifications)
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(tab === 'unread')
  }, [tab])

  async function handleOpen(notif: Notification) {
    setSelected(notif)
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
        decrement(1)
      } catch {
        // silently ignore
      }
    }
  }

  function handleNavigate(url: string) {
    setSelected(null)
    navigate(url)
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      resetToZero()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await notificationsApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Notification deleted')
    } catch {
      toast.error('Failed to delete notification')
    } finally {
      setDeletingId(null)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
                <Bell size={20} className="text-novbank-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 text-sm">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'You\'re all caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 text-sm font-medium text-novbank-600 hover:text-novbank-700 transition-colors"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.04}>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
            {(['all', 'unread'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* List */}
        <ScrollReveal delay={0.08}>
          <div className="card p-0 overflow-hidden divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <p className="font-semibold text-gray-600 text-lg">You're all caught up!</p>
                <p className="text-sm mt-1 text-gray-400">No notifications to show.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleOpen(notif)}
                    className={clsx(
                      'group relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors',
                      notif.is_read
                        ? 'hover:bg-gray-50/80'
                        : 'bg-blue-50/30 hover:bg-blue-50/50'
                    )}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}

                    {/* Type icon */}
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.text)}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={clsx('text-sm leading-snug', notif.is_read ? 'text-gray-700 font-normal' : 'text-gray-900 font-semibold')}>
                          {notif.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                          {formatDateTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      disabled={deletingId === notif.id}
                      className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                      title="Delete notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </ScrollReveal>
      </div>

      {selected && (
        <NotificationDetailModal
          notif={selected}
          onClose={() => setSelected(null)}
          onNavigate={handleNavigate}
        />
      )}
    </BankingLayout>
  )
}
