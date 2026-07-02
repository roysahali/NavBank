import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight, Smartphone, FileText, Receipt,
  TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle,
  Eye, EyeOff, ChevronRight, Wallet, CreditCard, Building2,
  ArrowUpRight, ArrowDownLeft, Heart, Shield, Percent, Gift,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonDashboard } from '../../components/ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { dashboardApi, type DashboardData } from '../../api/dashboard'
import { formatINR, formatINRShort, formatDateTime, getCategoryIcon, getCategoryColor, getModeBadge, getHour } from '../../utils/formatters'
import type { Transaction } from '../../types'
import clsx from 'clsx'

const PIE_COLORS = ['#2563EB', '#C8972A', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']


function InsightCard({ title, message, type }: { title: string; message: string; type: string }) {
  const config = {
    tip:     { icon: <Lightbulb size={15} />,     bg: 'bg-blue-50 border-blue-100',    icon_bg: 'bg-blue-100',    icon_color: 'text-blue-600',    title_color: 'text-blue-900' },
    warning: { icon: <AlertTriangle size={15} />, bg: 'bg-amber-50 border-amber-100',  icon_bg: 'bg-amber-100',   icon_color: 'text-amber-600',   title_color: 'text-amber-900' },
    success: { icon: <CheckCircle size={15} />,   bg: 'bg-emerald-50 border-emerald-100', icon_bg: 'bg-emerald-100', icon_color: 'text-emerald-600', title_color: 'text-emerald-900' },
  }
  const c = config[type as keyof typeof config] ?? config.tip
  return (
    <div className={clsx('rounded-xl border p-4 flex gap-3', c.bg)}>
      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', c.icon_bg, c.icon_color)}>{c.icon}</div>
      <div>
        <div className={clsx('text-sm font-semibold', c.title_color)}>{title}</div>
        <div className="text-gray-600 text-xs mt-0.5 leading-relaxed">{message}</div>
      </div>
    </div>
  )
}

function TransactionRow({ txn }: { txn: Transaction }) {
  const icon = getCategoryIcon(txn.category ?? txn.transaction_type)
  const colorClass = getCategoryColor(txn.category ?? txn.transaction_type)
  const isCredit = txn.transaction_type === 'deposit' || txn.transaction_type === 'credit'
  const modeBadge = txn.transfer_mode ? getModeBadge(txn.transfer_mode) : null

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0', colorClass)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {txn.beneficiary_name ?? txn.description ?? txn.transaction_type}
          </span>
          {modeBadge && (
            <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline', modeBadge)}>
              {txn.transfer_mode}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(txn.created_at)}</div>
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        {isCredit
          ? <ArrowDownLeft size={13} className="text-emerald-500" />
          : <ArrowUpRight size={13} className="text-red-500" />}
        <div className={clsx('text-sm font-semibold', isCredit ? 'text-emerald-600' : 'text-red-600')}>
          {isCredit ? '+' : '-'}{formatINR(txn.amount)}
        </div>
      </div>
    </div>
  )
}

const OFFERS = [
  {
    id: 'personal-loan',
    title: 'Personal Loan',
    subtitle: 'Get up to ₹25 Lakh',
    detail: 'Starting @ 10.5% p.a.',
    icon: <Building2 size={20} />,
    gradient: 'from-violet-600 to-purple-500',
    tag: 'Pre-approved',
    to: '/loans',
  },
  {
    id: 'health-insurance',
    title: 'Health Insurance',
    subtitle: 'Family cover up to ₹10L',
    detail: 'Just ₹499/month',
    icon: <Heart size={20} />,
    gradient: 'from-rose-500 to-pink-500',
    tag: 'New',
    to: '/insurance',
  },
  {
    id: 'zero-card',
    title: 'NovBank Platinum',
    subtitle: 'Zero annual fee credit card',
    detail: '5% cashback on spends',
    icon: <CreditCard size={20} />,
    gradient: 'from-novbank-800 to-novbank-600',
    tag: 'Exclusive',
    to: '/credit-cards',
  },
  {
    id: 'fd-offer',
    title: 'Fixed Deposit',
    subtitle: 'Earn up to 7.5% p.a.',
    detail: 'Senior citizens get 0.5% extra',
    icon: <Percent size={20} />,
    gradient: 'from-amber-500 to-orange-500',
    tag: 'High Returns',
    to: '/accounts',
  },
  {
    id: 'life-insurance',
    title: 'Term Life Plan',
    subtitle: '₹1 Crore cover',
    detail: 'Starting ₹699/month',
    icon: <Shield size={20} />,
    gradient: 'from-teal-600 to-emerald-500',
    tag: 'Best Value',
    to: '/insurance',
  },
  {
    id: 'rewards',
    title: 'NovBank Rewards',
    subtitle: 'Earn points on every txn',
    detail: '1000 bonus points on activation',
    icon: <Gift size={20} />,
    gradient: 'from-pink-500 to-fuchsia-500',
    tag: 'Limited',
    to: '/credit-cards',
  },
]

const QUICK_ACTIONS = [
  { label: 'Fund Transfer', sub: 'NEFT · RTGS · IMPS', icon: <ArrowLeftRight size={22} />, to: '/transfer', gradient: 'from-blue-600 to-blue-500', shadow: 'shadow-blue-200' },
  { label: 'UPI Pay',       sub: 'Instant payments',    icon: <Smartphone size={22} />,     to: '/upi',      gradient: 'from-orange-500 to-amber-400', shadow: 'shadow-orange-200' },
  { label: 'Credit Card',   sub: 'Bills & limits',       icon: <CreditCard size={22} />,     to: '/credit-cards', gradient: 'from-purple-600 to-violet-500', shadow: 'shadow-purple-200' },
  { label: 'Loans & EMI',   sub: 'Pay instalments',      icon: <Building2 size={22} />,      to: '/loans',    gradient: 'from-teal-600 to-emerald-500', shadow: 'shadow-teal-200' },
  { label: 'Statements',    sub: 'Download CSV',          icon: <FileText size={22} />,       to: '/reports',  gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-200' },
  { label: 'Transactions',  sub: 'Full history',          icon: <Receipt size={22} />,        to: '/transactions', gradient: 'from-slate-600 to-slate-500', shadow: 'shadow-slate-200' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(false)

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const hour = getHour()
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  if (loading) {
    return (
      <BankingLayout>
        <div className="p-6 lg:p-8 max-w-screen-xl mx-auto"><SkeletonDashboard /></div>
      </BankingLayout>
    )
  }

  const summary      = data?.summary
  const spendingData = data?.spending_by_category ?? []
  const monthlyFlow  = data?.monthly_flow ?? []
  const insights     = data?.ai_insights ?? []
  const recentTxns   = data?.recent_transactions ?? []

  return (
    <BankingLayout>
      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-novbank-950 via-novbank-900 to-novbank-800 relative overflow-hidden">
        {/* decorative rings */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/5" />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          {/* Greeting row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/50 text-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-white text-2xl font-bold mt-0.5">
                Good {hour}, {firstName}
              </h1>
            </div>
            <Link to="/transactions" className="hidden sm:flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors">
              All Transactions <ChevronRight size={12} />
            </Link>
          </div>

          {/* Balance + sub-stats */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            {/* Total balance */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total Portfolio Balance</p>
              <div className="flex items-center gap-3">
                <div className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  {hideBalance ? '₹ ••••••' : (summary ? formatINR(summary.total_balance) : '₹0.00')}
                </div>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                  {hideBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Sub-stats */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Savings', value: formatINRShort(summary?.savings_balance ?? 0), icon: <Wallet size={14} /> },
                { label: 'Current', value: formatINRShort(summary?.current_balance ?? 0), icon: <Landmark size={14} /> },
                { label: 'Cards', value: String(summary?.total_cards ?? 0), icon: <CreditCard size={14} /> },
                { label: 'Loans', value: String(summary?.active_loans ?? 0), icon: <Building2 size={14} /> },
              ].map((s) => (
                <div key={s.label} className="backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 min-w-[90px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-wider mb-0.5">
                    {s.icon} {s.label}
                  </div>
                  <div className="text-white font-semibold text-sm">{hideBalance ? '••••' : s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Quick actions */}
        <ScrollReveal>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to}>
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2.5 cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center group"
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow',
                    action.gradient, action.shadow
                  )}>
                    {action.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 leading-tight">{action.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{action.sub}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollReveal delay={0.05}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Receipt size={15} className="text-novbank-600" /> Spending by Category
              </h2>
              {spendingData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:w-44 h-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spendingData} dataKey="amount" nameKey="category"
                          cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                          {spendingData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatINR(v)}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #F3F4F6', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {spendingData.slice(0, 6).map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs text-gray-500 capitalize flex-1">{cat.category}</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-14 text-right">{formatINRShort(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No spending data</div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <TrendingUp size={15} className="text-novbank-600" /> Monthly Cash Flow
              </h2>
              {monthlyFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyFlow} barGap={2} barSize={9}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatINRShort(v)} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip formatter={(v: number) => formatINR(v)}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #F3F4F6', fontSize: '12px' }} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="inflow"  name="Inflow"  fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outflow" name="Outflow" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No flow data</div>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <ScrollReveal delay={0.05}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb size={15} className="text-novbank-gold" /> Smart Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {insights.map((ins, i) => <InsightCard key={i} {...ins} />)}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Exclusive offers */}
        <ScrollReveal delay={0.05}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Gift size={15} className="text-novbank-gold" /> Exclusive Offers For You
              </h2>
              <span className="text-[10px] font-medium text-novbank-600 bg-novbank-50 px-2 py-0.5 rounded-full">
                {OFFERS.length} offers
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {OFFERS.map((offer) => (
                <Link key={offer.id} to={offer.to} className="shrink-0 w-52">
                  <motion.div
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={clsx(
                      'relative rounded-2xl p-4 text-white bg-gradient-to-br overflow-hidden cursor-pointer',
                      offer.gradient
                    )}
                  >
                    <div className="absolute -right-3 -bottom-3 opacity-20 scale-[2]">{offer.icon}</div>
                    <div className="relative">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                        {offer.tag}
                      </span>
                      <div className="mt-3 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                          {offer.icon}
                        </div>
                        <div className="font-bold text-sm leading-tight">{offer.title}</div>
                        <div className="text-white/80 text-xs mt-0.5">{offer.subtitle}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white/70 text-[11px]">{offer.detail}</span>
                        <ChevronRight size={13} className="text-white/60" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Recent transactions */}
        <ScrollReveal delay={0.05}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-xs text-novbank-600 font-medium hover:text-novbank-700 flex items-center gap-0.5">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            {recentTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                <TrendingDown size={30} className="mb-2" />
                <p className="text-sm">No recent transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTxns.map((txn) => <TransactionRow key={txn.id} txn={txn} />)}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </BankingLayout>
  )
}

// local alias to avoid import collision
function Landmark(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
      <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
      <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
    </svg>
  )
}
