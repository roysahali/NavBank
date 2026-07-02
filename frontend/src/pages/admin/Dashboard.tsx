import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Landmark, ArrowLeftRight, Shield, CreditCard, Building2, TrendingUp } from 'lucide-react'
import { adminApi } from '../../api/admin'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { formatINR, formatDateTime } from '../../utils/formatters'
import type { AdminStats, Transaction } from '../../types'

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getTransactions()])
      .then(([s, t]) => { setStats(s); setTxns(t.slice(0, 10)) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Bank-wide operations overview</p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : stats && (
          <>
            <ScrollReveal delay={0.05}>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Customers" value={stats.total_users} sub="Registered users" icon={<Users size={18} className="text-white" />} color="bg-blue-600" />
                <StatCard label="Total Accounts" value={stats.total_accounts} sub="Across all customers" icon={<Landmark size={18} className="text-white" />} color="bg-teal-600" />
                <StatCard label="Assets Under Mgmt" value={formatINR(stats.total_balance)} sub="Combined balance" icon={<TrendingUp size={18} className="text-white" />} color="bg-emerald-600" />
                <StatCard label="Transactions" value={stats.total_transactions} sub="All time volume" icon={<ArrowLeftRight size={18} className="text-white" />} color="bg-amber-600" />
                <StatCard label="Credit Cards" value={stats.total_cards ?? '—'} sub="Issued cards" icon={<CreditCard size={18} className="text-white" />} color="bg-purple-600" />
                <StatCard label="Active Loans" value={stats.total_loans ?? '—'} sub="Loan accounts" icon={<Building2 size={18} className="text-white" />} color="bg-rose-600" />
              </div>
            </ScrollReveal>

            {/* Quick links */}
            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { to: '/admin/users', icon: <Users size={18} />, label: 'Manage Users', desc: 'Enable/disable accounts', color: 'bg-blue-100 text-blue-700' },
                  { to: '/admin/accounts', icon: <Landmark size={18} />, label: 'Manage Accounts', desc: 'Freeze, deposit, create', color: 'bg-teal-100 text-teal-700' },
                  { to: '/admin/transactions', icon: <ArrowLeftRight size={18} />, label: 'All Transactions', desc: 'Full audit trail', color: 'bg-amber-100 text-amber-700' },
                ].map((item) => (
                  <Link key={item.to} to={item.to}>
                    <div className="card hover:shadow-md transition-all cursor-pointer flex items-center gap-4 py-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="card py-4 flex items-center gap-4 bg-novbank-900 border-novbank-800">
                  <div className="w-11 h-11 rounded-xl bg-novbank-gold/20 flex items-center justify-center">
                    <Shield size={18} className="text-novbank-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Admin Panel</div>
                    <div className="text-xs text-white/40">Privileged access</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Recent transactions */}
            <ScrollReveal delay={0.15}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
                  <Link to="/admin/transactions" className="text-sm text-novbank-600 hover:text-novbank-700">View all</Link>
                </div>
                <div className="card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['ID', 'Type', 'Description', 'Date', 'Amount', 'Status'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {txns.map((txn) => (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{txn.id}</td>
                            <td className="px-4 py-3 text-xs font-medium text-gray-900 capitalize">{txn.transaction_type}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{txn.description}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(txn.created_at)}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-900">{formatINR(txn.amount)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                txn.status === 'completed' || txn.status === 'success'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {txn.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </>
        )}
      </div>
    </BankingLayout>
  )
}
