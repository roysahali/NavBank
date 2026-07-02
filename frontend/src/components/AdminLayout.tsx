import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/admin/transactions', label: 'Transactions', icon: '📋' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="px-6 py-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span className="text-white text-xl font-bold tracking-tight">NovBank</span>
          </div>
          <span className="mt-1 inline-block bg-amber-500 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded">
            Admin Portal
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-gray-900'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-6 border-t border-gray-800">
          <p className="text-gray-300 text-xs mb-1 truncate">{user?.full_name}</p>
          <p className="text-gray-500 text-xs mb-3 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors w-full text-left">
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
