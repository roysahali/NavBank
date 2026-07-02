import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
  Building2,
  FileText,
  LogOut,
  X,
  Shield,
  ChevronRight,
  Bell,
  LifeBuoy,
  MessageCircle,
  Banknote,
  Heart,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const customerNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Accounts', to: '/accounts', icon: <Landmark size={18} /> },
  { label: 'Transactions', to: '/transactions', icon: <ArrowLeftRight size={18} /> },
  { label: 'UPI', to: '/upi', icon: <Smartphone size={18} /> },
  { label: 'Credit Cards', to: '/credit-cards', icon: <CreditCard size={18} /> },
  { label: 'Loans', to: '/loans', icon: <Building2 size={18} /> },
  { label: 'Insurance', to: '/insurance', icon: <Heart size={18} /> },
  { label: 'Reports', to: '/reports', icon: <FileText size={18} /> },
  { label: 'Notifications', to: '/notifications', icon: <Bell size={18} /> },
  { label: 'Support', to: '/support', icon: <LifeBuoy size={18} /> },
  { label: 'Chat with Nova', to: '/chat', icon: <MessageCircle size={18} /> },
]

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', to: '/admin/users', icon: <Shield size={18} /> },
  { label: 'Accounts', to: '/admin/accounts', icon: <Landmark size={18} /> },
  { label: 'Transactions', to: '/admin/transactions', icon: <ArrowLeftRight size={18} /> },
  { label: 'Deposits', to: '/admin/deposits', icon: <Banknote size={18} /> },
  { label: 'Loan Applications', to: '/admin/loan-applications', icon: <Building2 size={18} /> },
  { label: 'Audit Log', to: '/admin/audit', icon: <ClipboardList size={18} /> },
  { label: 'Support', to: '/admin/support', icon: <LifeBuoy size={18} /> },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isAdmin?: boolean
}

function SidebarContent({ isAdmin, onClose }: { isAdmin?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = isAdmin ? adminNavItems : customerNavItems
  const { unreadCount } = useNotifications()

  function handleLogout() {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-novbank-900">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-novbank-gold to-novbank-gold-light flex items-center justify-center shadow-lg">
            <Shield size={18} className="text-novbank-950" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none tracking-wide">NovBank</div>
            <div className="text-white/40 text-[10px] mt-0.5 tracking-wider uppercase">
              {isAdmin ? 'Admin Portal' : 'Internet Banking'}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              clsx(
                'nav-item group',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx(
                  'transition-colors',
                  isActive ? 'text-novbank-gold' : 'text-current'
                )}>
                  {item.icon}
                </span>
                <span className="flex-1 text-[13px]">{item.label}</span>
                {item.to === '/notifications' && !isAdmin && unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {isActive && !(item.to === '/notifications' && !isAdmin && unreadCount > 0) && (
                  <ChevronRight size={14} className="text-novbank-gold opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* User profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-novbank-600 to-novbank-700 flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.full_name}</div>
            <div className="text-white/40 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen = true, onClose, isAdmin }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-screen sticky top-0">
        <SidebarContent isAdmin={isAdmin} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col"
            >
              <SidebarContent isAdmin={isAdmin} onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
