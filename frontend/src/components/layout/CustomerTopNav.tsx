import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Landmark, ArrowLeftRight, Smartphone,
  CreditCard, Building2, FileText, Bell, LifeBuoy, MessageCircle,
  LogOut, ChevronDown, Shield, Menu, X, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { notificationsApi } from '../../api/notifications'

interface DropdownItem { label: string; to: string; icon: React.ReactNode; desc?: string }

const paymentsItems: DropdownItem[] = [
  { label: 'Fund Transfer', to: '/transfer', icon: <ArrowLeftRight size={16} />, desc: 'NEFT · RTGS · IMPS' },
  { label: 'UPI Payments', to: '/upi', icon: <Smartphone size={16} />, desc: 'Pay via VPA' },
  { label: 'Transaction History', to: '/transactions', icon: <FileText size={16} />, desc: 'View all transactions' },
]

const loansCardsItems: DropdownItem[] = [
  { label: 'Credit Cards', to: '/credit-cards', icon: <CreditCard size={16} />, desc: 'Bills · Statements · Limits' },
  { label: 'Loans & EMI', to: '/loans', icon: <Building2 size={16} />, desc: 'Home · Personal · Auto' },
]

const moreItems: DropdownItem[] = [
  { label: 'Reports', to: '/reports', icon: <FileText size={16} />, desc: 'CSV export' },
  { label: 'Support', to: '/support', icon: <LifeBuoy size={16} />, desc: 'Raise a ticket' },
  { label: 'Chat with Nova', to: '/chat', icon: <Sparkles size={16} />, desc: 'AI assistant' },
]

function Dropdown({ label, items, icon }: { label: string; items: DropdownItem[]; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = items.some((i) => window.location.pathname.startsWith(i.to))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
          isActive
            ? 'text-novbank-700 bg-novbank-50'
            : 'text-gray-600 hover:text-novbank-700 hover:bg-gray-50'
        )}
      >
        {icon}
        {label}
        <ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors',
                    isActive && 'bg-novbank-50'
                  )
                }
              >
                <span className="mt-0.5 text-novbank-600 shrink-0">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.label}</div>
                  {item.desc && <div className="text-[11px] text-gray-400">{item.desc}</div>}
                </div>
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserMenu({ unreadCount }: { unreadCount: number }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    setOpen(false)
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const initials = user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* Notification bell */}
      <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Avatar dropdown */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-semibold text-gray-800 leading-none">{user?.full_name?.split(' ')[0]}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Internet Banking</div>
        </div>
        <ChevronDown size={12} className={clsx('text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 bg-gradient-to-r from-novbank-900 to-novbank-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-novbank-gold/30 flex items-center justify-center">
                  <span className="text-novbank-gold font-bold text-sm">{initials}</span>
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{user?.full_name}</div>
                  <div className="text-white/50 text-[11px] truncate">{user?.email}</div>
                </div>
              </div>
            </div>
            <div className="py-1">
              <Link to="/notifications" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Bell size={15} className="text-gray-400" /> Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/support" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <LifeBuoy size={15} className="text-gray-400" /> Help & Support
              </Link>
              <div className="my-1 border-t border-gray-100" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CustomerTopNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetch = () => notificationsApi.getUnreadCount().then((d) => setUnreadCount(d.count)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* ── Brand bar ─────────────────────────────────────────────────────── */}
      <div className="bg-novbank-950 border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-novbank-gold to-novbank-gold-light flex items-center justify-center shadow">
              <Shield size={14} className="text-novbank-950" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-[15px] tracking-wide">NovBank</span>
              <span className="text-white/30 text-[9px] tracking-widest uppercase">Internet Banking</span>
            </div>
          </Link>

          {/* Right side: user menu + mobile hamburger */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex">
              <UserMenu unreadCount={unreadCount} />
            </div>
            <button
              className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main nav bar ──────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 h-11 flex items-center gap-1">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive ? 'text-novbank-700 bg-novbank-50' : 'text-gray-600 hover:text-novbank-700 hover:bg-gray-50'
              )
            }
          >
            <LayoutDashboard size={14} /> Dashboard
          </NavLink>

          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive ? 'text-novbank-700 bg-novbank-50' : 'text-gray-600 hover:text-novbank-700 hover:bg-gray-50'
              )
            }
          >
            <Landmark size={14} /> Accounts
          </NavLink>

          <Dropdown label="Payments" icon={<ArrowLeftRight size={14} />} items={paymentsItems} />
          <Dropdown label="Cards & Loans" icon={<CreditCard size={14} />} items={loansCardsItems} />
          <Dropdown label="More" items={moreItems} />
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-72 bg-white flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-4 bg-novbank-950">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-novbank-gold flex items-center justify-center">
                    <Shield size={12} className="text-novbank-950" />
                  </div>
                  <span className="text-white font-bold text-sm">NovBank</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                {[
                  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={16} /> },
                  { label: 'Accounts', to: '/accounts', icon: <Landmark size={16} /> },
                  { label: 'Fund Transfer', to: '/transfer', icon: <ArrowLeftRight size={16} /> },
                  { label: 'UPI Payments', to: '/upi', icon: <Smartphone size={16} /> },
                  { label: 'Transactions', to: '/transactions', icon: <FileText size={16} /> },
                  { label: 'Credit Cards', to: '/credit-cards', icon: <CreditCard size={16} /> },
                  { label: 'Loans & EMI', to: '/loans', icon: <Building2 size={16} /> },
                  { label: 'Reports', to: '/reports', icon: <FileText size={16} /> },
                  { label: 'Notifications', to: '/notifications', icon: <Bell size={16} />, badge: unreadCount },
                  { label: 'Support', to: '/support', icon: <LifeBuoy size={16} /> },
                  { label: 'Chat with Nova', to: '/chat', icon: <MessageCircle size={16} /> },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-novbank-50 text-novbank-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )
                    }
                  >
                    <span className="text-current">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {'badge' in item && (item.badge ?? 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-gray-100 p-4">
                <UserMenu unreadCount={unreadCount} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
