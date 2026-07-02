import { useEffect, useRef, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import CustomerTopNav from './CustomerTopNav'
import ChatWidget from '../chat/ChatWidget'
import AccountFrozenModal from '../ui/AccountFrozenModal'
import { useNotifications } from '../../contexts/NotificationContext'
import { notificationsApi } from '../../api/notifications'

interface BankingLayoutProps {
  children: React.ReactNode
  isAdmin?: boolean
}

// Shows a toast when unread count increases, and pops AccountFrozenModal
// if a new "Account Frozen" notification arrives via polling.
function NotificationWatcher({ isAdmin, onFrozen }: { isAdmin?: boolean; onFrozen: (msg?: string) => void }) {
  const { unreadCount } = useNotifications()
  const prevRef = useRef<number | null>(null)

  useEffect(() => {
    if (isAdmin) return
    if (prevRef.current !== null && unreadCount > prevRef.current) {
      const diff = unreadCount - prevRef.current
      // Fetch the latest unread notifications to check for freeze alerts
      notificationsApi.list(true).then(notifs => {
        const freezeNotif = notifs.find(
          n => !n.is_read && n.type === 'alert' &&
               (n.title.toLowerCase().includes('frozen') || n.title.toLowerCase().includes('freeze'))
        )
        if (freezeNotif) {
          onFrozen(freezeNotif.message)
        } else {
          toast(
            <span className="flex items-center gap-2 text-sm">
              <Bell size={14} className="text-novbank-600 shrink-0" />
              You have {diff} new notification{diff > 1 ? 's' : ''}
            </span>,
            { duration: 5000, id: 'notif-new' }
          )
        }
      }).catch(() => {
        toast(
          <span className="flex items-center gap-2 text-sm">
            <Bell size={14} className="text-novbank-600 shrink-0" />
            You have {diff} new notification{diff > 1 ? 's' : ''}
          </span>,
          { duration: 5000, id: 'notif-new' }
        )
      })
    }
    prevRef.current = unreadCount
  }, [unreadCount, isAdmin, onFrozen])

  return null
}

export default function BankingLayout({ children, isAdmin }: BankingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [frozenOpen, setFrozenOpen] = useState(false)
  const [frozenMessage, setFrozenMessage] = useState<string | undefined>()

  function showFrozen(msg?: string) {
    setFrozenMessage(msg)
    setFrozenOpen(true)
  }

  // Listen for frozen-account errors fired by the API client
  useEffect(() => {
    if (isAdmin) return
    const handler = (e: Event) => {
      showFrozen((e as CustomEvent<{ message: string }>).detail?.message)
    }
    window.addEventListener('account-frozen', handler)
    return () => window.removeEventListener('account-frozen', handler)
  }, [isAdmin])

  return (
    <div className={isAdmin ? 'flex min-h-screen bg-slate-50' : 'min-h-screen bg-gray-50'}>
      {isAdmin ? (
        <>
          <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} isAdmin />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </>
      ) : (
        <div className="flex flex-col min-h-screen">
          <CustomerTopNav />
          <main className="flex-1">{children}</main>
        </div>
      )}

      <NotificationWatcher isAdmin={isAdmin} onFrozen={showFrozen} />
      <ChatWidget />

      <AccountFrozenModal
        open={frozenOpen}
        message={frozenMessage}
        onClose={() => setFrozenOpen(false)}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid #F3F4F6',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
