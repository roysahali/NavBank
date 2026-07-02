import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, CreditCard, Landmark, ArrowLeftRight,
  Smartphone, Bell, Wallet, Shield, CheckCircle,
  XCircle, Lock, Unlock, Ban, IndianRupee, Clock, AlertCircle,
  TrendingUp, ChevronRight, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { adminApi, UserFullProfile, ProfileAccount } from '../../api/admin'
import { formatINR, formatDateTime } from '../../utils/formatters'

const TABS = [
  { key: 'overview',      label: 'Overview',      icon: <User size={14} /> },
  { key: 'accounts',      label: 'Accounts',       icon: <Landmark size={14} /> },
  { key: 'transactions',  label: 'Transactions',   icon: <ArrowLeftRight size={14} /> },
  { key: 'upi',           label: 'UPI',            icon: <Smartphone size={14} /> },
  { key: 'cards',         label: 'Cards',          icon: <CreditCard size={14} /> },
  { key: 'loans',         label: 'Loans',          icon: <TrendingUp size={14} /> },
  { key: 'deposits',      label: 'Deposits',       icon: <Wallet size={14} /> },
  { key: 'notifications', label: 'Notifications',  icon: <Bell size={14} /> },
] as const

type TabKey = typeof TABS[number]['key']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    frozen: 'bg-blue-100 text-blue-700',
    blocked: 'bg-red-100 text-red-600',
    inactive: 'bg-gray-100 text-gray-500',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-600',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-600',
    success: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
    overdue: 'bg-red-100 text-red-600',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[status] ?? 'bg-gray-100 text-gray-500')}>
      {status}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value ?? '—'}</span>
    </div>
  )
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserFullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('overview')
  const [freezing, setFreezing] = useState<number | null>(null)
  const [blocking, setBlocking] = useState<number | null>(null)
  const [depositing, setDepositing] = useState<number | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')

  async function load() {
    if (!userId) return
    setLoading(true)
    try {
      const data = await adminApi.getUserFullProfile(Number(userId))
      setProfile(data)
    } catch {
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  async function handleFreezeToggle(acc: ProfileAccount) {
    setFreezing(acc.id)
    try {
      if (acc.status === 'frozen') {
        await adminApi.unfreezeAccount(acc.id)
        toast.success(`Account ${acc.account_number} reactivated`)
      } else {
        await adminApi.freezeAccount(acc.id)
        toast.success(`Account ${acc.account_number} frozen`)
      }
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setFreezing(null)
    }
  }

  async function handleBlockCard(cardId: number) {
    setBlocking(cardId)
    try {
      await adminApi.blockCard(cardId)
      toast.success('Card blocked')
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBlocking(null)
    }
  }

  async function handleDeposit(accId: number) {
    const amt = parseFloat(depositAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setDepositing(accId)
    try {
      await adminApi.deposit({ account_id: accId, amount: amt, description: depositNote || 'Admin deposit' })
      toast.success(`${formatINR(amt)} deposited`)
      setDepositAmount('')
      setDepositNote('')
      setDepositing(null)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed')
      setDepositing(null)
    }
  }

  if (loading) {
    return (
      <BankingLayout isAdmin>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </BankingLayout>
    )
  }

  if (!profile) {
    return (
      <BankingLayout isAdmin>
        <div className="p-8 text-center text-gray-500">User not found</div>
      </BankingLayout>
    )
  }

  const { user, accounts, transactions, upi_vpas, upi_transactions, credit_cards, loans, loan_applications, deposit_requests, notifications } = profile

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const activeLoans = loans.filter(l => l.status === 'active')
  const pendingApps = loan_applications.filter(a => a.status === 'pending')
  const unreadNotifs = notifications.filter(n => !n.is_read).length

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg">
                {user.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
                <p className="text-sm text-gray-400">{user.email} · {user.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
                user.kyc_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                user.kyc_status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-600')}>
                <Shield size={10} />
                KYC {user.kyc_status}
              </span>
              <span className={clsx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
                user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {user.is_active ? 'Active' : 'Disabled'}
              </span>
              <button onClick={load} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Balance', value: formatINR(totalBalance), color: 'text-blue-600' },
              { label: 'Accounts', value: accounts.length, color: 'text-indigo-600' },
              { label: 'Active Loans', value: activeLoans.length, color: 'text-amber-600' },
              { label: 'Cards', value: credit_cards.length, color: 'text-purple-600' },
              { label: 'Unread Notifs', value: unreadNotifs, color: 'text-rose-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t.icon}
                {t.label}
                {t.key === 'loans' && pendingApps.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingApps.length}
                  </span>
                )}
                {t.key === 'notifications' && unreadNotifs > 0 && (
                  <span className="ml-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-5">
              <SectionCard title="Personal Details">
                <InfoRow label="Full Name" value={user.full_name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Mobile" value={user.mobile} />
                <InfoRow label="Role" value={<span className="capitalize">{user.role}</span>} />
                <InfoRow label="KYC Status" value={<StatusBadge status={user.kyc_status} />} />
                <InfoRow label="Account Status" value={user.is_active ? 'Active' : 'Disabled'} />
                <InfoRow label="Member Since" value={user.created_at ? formatDateTime(user.created_at) : '—'} />
              </SectionCard>

              <SectionCard title="Account Summary">
                {accounts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No accounts</p>
                ) : accounts.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 font-mono">{a.account_number}</p>
                      <p className="text-xs text-gray-400 capitalize">{a.account_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatINR(a.balance)}</p>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </SectionCard>

              <SectionCard title="Recent Transactions">
                {transactions.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No transactions</p>
                ) : transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center',
                        t.transaction_type === 'deposit' ? 'bg-emerald-100' :
                        t.transaction_type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100')}>
                        <ArrowLeftRight size={12} className={
                          t.transaction_type === 'deposit' ? 'text-emerald-600' :
                          t.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-blue-600'
                        } />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 capitalize">{t.transaction_type}</p>
                        <p className="text-[10px] text-gray-400">{t.created_at ? formatDateTime(t.created_at) : ''}</p>
                      </div>
                    </div>
                    <span className={clsx('text-sm font-semibold',
                      t.transaction_type === 'deposit' ? 'text-emerald-600' :
                      t.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-blue-600')}>
                      {formatINR(t.amount)}
                    </span>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <button onClick={() => setTab('transactions')} className="mt-3 text-xs text-blue-600 flex items-center gap-1">
                    View all {transactions.length} transactions <ChevronRight size={12} />
                  </button>
                )}
              </SectionCard>

              <SectionCard title="Active Loans">
                {activeLoans.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No active loans</p>
                ) : activeLoans.map(l => (
                  <div key={l.id} className="py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 capitalize">{l.loan_type} Loan</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-gray-900">{formatINR(l.outstanding_amount)} outstanding</span>
                      <span className="text-xs text-gray-400">EMI {formatINR(l.emi_amount)}/mo</span>
                    </div>
                  </div>
                ))}
              </SectionCard>
            </div>
          )}

          {/* ── Accounts ── */}
          {tab === 'accounts' && (
            <div className="space-y-4">
              {accounts.length === 0 && <p className="text-center text-gray-400 py-8">No accounts found</p>}
              {accounts.map(acc => (
                <div key={acc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-base font-bold text-gray-900 font-mono">{acc.account_number}</p>
                      <p className="text-xs text-gray-400 capitalize">{acc.account_type} account · {acc.branch_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-700">{formatINR(acc.balance)}</p>
                      <StatusBadge status={acc.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[10px] text-gray-400">IFSC</p>
                      <p className="text-xs font-medium text-gray-700">{acc.ifsc_code}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[10px] text-gray-400">Interest</p>
                      <p className="text-xs font-medium text-gray-700">{acc.interest_rate}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[10px] text-gray-400">Opened</p>
                      <p className="text-xs font-medium text-gray-700">{acc.created_at ? formatDateTime(acc.created_at).slice(0, 10) : '—'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleFreezeToggle(acc)}
                      disabled={freezing === acc.id}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50',
                        acc.status === 'frozen'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      )}
                    >
                      {acc.status === 'frozen' ? <Unlock size={14} /> : <Lock size={14} />}
                      {freezing === acc.id ? '…' : acc.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                    </button>

                    <div className="flex-1 flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={depositing === acc.id ? depositAmount : ''}
                        onChange={e => { setDepositing(acc.id); setDepositAmount(e.target.value) }}
                        onFocus={() => setDepositing(acc.id)}
                        className="input flex-1 text-sm py-2 min-w-0"
                      />
                      <button
                        onClick={() => handleDeposit(acc.id)}
                        disabled={depositing === acc.id && !depositAmount}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <IndianRupee size={13} /> Deposit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'transactions' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">All Transactions ({transactions.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['ID', 'Type', 'Amount', 'Status', 'Description', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-gray-400 py-8 text-sm">No transactions</td></tr>
                    ) : transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{t.id}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs font-medium capitalize',
                            t.transaction_type === 'deposit' ? 'text-emerald-600' :
                            t.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-blue-600')}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatINR(t.amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{t.description || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{t.created_at ? formatDateTime(t.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── UPI ── */}
          {tab === 'upi' && (
            <div className="space-y-5">
              <SectionCard title={`UPI IDs (${upi_vpas.length})`}>
                {upi_vpas.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No UPI IDs registered</p>
                ) : upi_vpas.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-blue-700 font-mono">{v.vpa}</p>
                      <p className="text-xs text-gray-400">Linked account #{v.linked_account_id}</p>
                    </div>
                    {v.is_primary && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Primary</span>
                    )}
                  </div>
                ))}
              </SectionCard>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">UPI Transactions ({upi_transactions.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Sender', 'Receiver', 'Amount', 'Status', 'Note', 'Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {upi_transactions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-8 text-sm">No UPI transactions</td></tr>
                      ) : upi_transactions.map(u => {
                        const isOwn = upi_vpas.some(v => v.vpa === u.sender_vpa)
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-gray-700">{u.sender_vpa}</td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-700">{u.receiver_vpa}</td>
                            <td className={clsx('px-4 py-3 text-sm font-semibold', isOwn ? 'text-red-600' : 'text-emerald-600')}>
                              {isOwn ? '−' : '+'}{formatINR(u.amount)}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{u.note || '—'}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{u.created_at ? formatDateTime(u.created_at) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Cards ── */}
          {tab === 'cards' && (
            <div className="grid lg:grid-cols-2 gap-4">
              {credit_cards.length === 0 && (
                <p className="col-span-2 text-center text-gray-400 py-8">No credit cards</p>
              )}
              {credit_cards.map(card => (
                <div key={card.id} className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-10 -translate-y-10" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-8 translate-y-8" />

                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div>
                      <p className="text-white/50 text-xs">{card.card_type}</p>
                      <p className="text-lg font-bold tracking-wider mt-1">{card.card_number}</p>
                    </div>
                    <StatusBadge status={card.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
                    <div>
                      <p className="text-white/40 text-[10px]">Limit</p>
                      <p className="text-sm font-semibold">{formatINR(card.credit_limit)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">Outstanding</p>
                      <p className="text-sm font-semibold">{formatINR(card.outstanding_amount)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px]">Points</p>
                      <p className="text-sm font-semibold">{card.reward_points.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <p className="text-white/50 text-xs">Expires {card.expiry_month}/{card.expiry_year}</p>
                    {card.status !== 'blocked' && (
                      <button
                        onClick={() => handleBlockCard(card.id)}
                        disabled={blocking === card.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Ban size={12} />
                        {blocking === card.id ? 'Blocking…' : 'Block Card'}
                      </button>
                    )}
                    {card.status === 'blocked' && (
                      <span className="text-xs text-red-400 flex items-center gap-1"><Ban size={12} /> Blocked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Loans ── */}
          {tab === 'loans' && (
            <div className="space-y-5">
              <SectionCard title={`Active Loans (${loans.length})`}>
                {loans.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No loans</p>
                ) : loans.map(l => (
                  <div key={l.id} className="py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800 capitalize">{l.loan_type} Loan</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Principal', value: formatINR(l.principal_amount) },
                        { label: 'Outstanding', value: formatINR(l.outstanding_amount) },
                        { label: 'Rate', value: `${l.interest_rate}% p.a.` },
                        { label: 'EMI', value: formatINR(l.emi_amount) },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                          <p className="text-xs font-semibold text-gray-800">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </SectionCard>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Loan Applications ({loan_applications.length})</h3>
                  {pendingApps.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{pendingApps.length} pending</span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Type', 'Amount', 'Tenure', 'Purpose', 'Status', 'Applied'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loan_applications.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-8 text-sm">No loan applications</td></tr>
                      ) : loan_applications.map(la => (
                        <tr key={la.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium capitalize text-gray-800">{la.loan_type}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatINR(la.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{la.tenure_months}mo</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{la.purpose}</td>
                          <td className="px-4 py-3"><StatusBadge status={la.status} /></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{la.created_at ? formatDateTime(la.created_at) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Deposits ── */}
          {tab === 'deposits' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Deposit Requests ({deposit_requests.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['ID', 'Amount', 'Status', 'Requested'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {deposit_requests.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-8 text-sm">No deposit requests</td></tr>
                    ) : deposit_requests.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{d.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatINR(d.amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{d.created_at ? formatDateTime(d.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 && <p className="text-center text-gray-400 py-8">No notifications</p>}
              {notifications.map(n => (
                <div key={n.id} className={clsx(
                  'bg-white rounded-2xl border shadow-sm p-4 flex gap-4',
                  !n.is_read ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
                )}>
                  <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    n.type === 'alert' ? 'bg-red-100' :
                    n.type === 'success' ? 'bg-emerald-100' :
                    n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100')}>
                    <AlertCircle size={16} className={
                      n.type === 'alert' ? 'text-red-600' :
                      n.type === 'success' ? 'text-emerald-600' :
                      n.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                    } />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <div className="flex items-center gap-2">
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {n.created_at ? formatDateTime(n.created_at) : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </div>
    </BankingLayout>
  )
}
