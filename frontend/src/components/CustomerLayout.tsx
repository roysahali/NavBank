import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/transactions', label: 'Transactions', icon: '📋' },
  { to: '/transfer', label: 'Transfer', icon: '↗️' },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f2b4c] flex flex-col">
        <div className="px-6 py-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <span className="text-white text-xl font-bold tracking-tight">NovBank</span>
          </div>
          <p className="text-blue-300 text-xs mt-1">Personal Banking</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-6 border-t border-blue-800">
          <p className="text-blue-200 text-xs mb-1 truncate">{user?.full_name}</p>
          <p className="text-blue-400 text-xs mb-3 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="text-sm text-blue-300 hover:text-white transition-colors w-full text-left">
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
