import { useEffect, useState } from 'react'
import { Copy, CheckCheck, Landmark, TrendingUp, TrendingDown, ArrowLeftRight, ChevronDown, ChevronUp, DollarSign, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { accountsApi } from '../../api/accounts'
import { transactionsApi } from '../../api/transactions'
import { formatINR, formatDateTime, maskAccount, getCategoryIcon, getCategoryColor } from '../../utils/formatters'
import type { Account, Transaction } from '../../types'
import clsx from 'clsx'

type ActionPanel = 'mini' | 'deposit' | 'withdraw' | null

function AccountCard({ account }: { account: Account }) {
  const [copied, setCopied] = useState(false)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loadingTxns, setLoadingTxns] = useState(false)
  const [activePanel, setActivePanel] = useState<ActionPanel>(null)
  const [actionAmount, setActionAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  function copyAccountNumber() {
    navigator.clipboard.writeText(account.account_number)
    setCopied(true)
    toast.success('Account number copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function loadMiniStatement() {
    if (activePanel === 'mini') {
      setActivePanel(null)
      return
    }
    setActivePanel('mini')
    if (txns.length > 0) return
    setLoadingTxns(true)
    try {
      const data = await accountsApi.getMiniStatement(account.id)
      setTxns(data)
    } catch {
      toast.error('Failed to load mini statement')
      setActivePanel(null)
    } finally {
      setLoadingTxns(false)
    }
  }

  function togglePanel(panel: 'deposit' | 'withdraw') {
    setActivePanel(prev => (prev === panel ? null : panel))
    setActionAmount('')
  }

  async function handleAction(type: 'deposit' | 'withdraw') {
    const amount = parseFloat(actionAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setActionLoading(true)
    try {
      if (type === 'deposit') {
        await transactionsApi.deposit({ account_id: account.id, amount, description: 'Self deposit' })
        toast.success(`${formatINR(amount)} deposited successfully`)
      } else {
        await transactionsApi.withdraw({ account_id: account.id, amount, description: 'Self withdrawal' })
        toast.success(`${formatINR(amount)} withdrawn successfully`)
      }
      setActivePanel(null)
      setActionAmount('')
      // Reset mini statement cache so it refreshes next time
      setTxns([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} failed`)
    } finally {
      setActionLoading(false)
    }
  }

  const gradients: Record<string, string> = {
    savings: 'from-novbank-950 via-novbank-900 to-novbank-800',
    current: 'from-[#1A0A3B] via-[#2D1B69] to-[#3B2A8A]',
  }
  const gradient = gradients[account.account_type] ?? gradients.savings

  const memberSince = new Date(account.created_at).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <ScrollReveal>
      <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/10">
        {/* Card top — gradient */}
        <div className={clsx('relative bg-gradient-to-br p-6 text-white overflow-hidden', gradient)}>
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-white/3 to-transparent rounded-full pointer-events-none" />

          <div className="relative">
            {/* Top row: logo + badge + status */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-novbank-gold to-novbank-gold-light flex items-center justify-center shadow-md shadow-novbank-gold/30">
                  <Landmark size={18} className="text-novbank-950" />
                </div>
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest">NovBank</div>
                  <div className="text-white/80 text-xs font-semibold capitalize tracking-wide">
                    {account.account_type} Account
                  </div>
                </div>
              </div>
              <span className={clsx(
                'px-3 py-1 rounded-full text-xs font-semibold tracking-wide',
                account.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              )}>
                {account.status === 'active' ? '● Active' : '⏸ Frozen'}
              </span>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <div className="text-white/40 text-xs mb-1 uppercase tracking-widest">Available Balance</div>
              <div className="text-4xl font-bold tracking-tight">{formatINR(account.balance)}</div>
            </div>

            {/* Account number row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Account Number</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm tracking-widest text-white/80">
                    {maskAccount(account.account_number)}
                  </span>
                  <button
                    onClick={copyAccountNumber}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Copy account number"
                  >
                    {copied ? <CheckCheck size={12} className="text-emerald-300" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Member Since</div>
                <div className="text-white/60 text-xs font-medium">{memberSince}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card bottom — white details */}
        <div className="bg-white">
          {/* Details row */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="p-4 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">IFSC Code</div>
              <div className="text-xs font-mono font-semibold text-gray-700">{account.ifsc_code}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Branch</div>
              <div className="text-xs font-semibold text-gray-700 truncate">{account.branch_name}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Interest</div>
              <div className="text-xs font-semibold text-novbank-700">{account.interest_rate}% p.a.</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 p-4">
            <button
              onClick={loadMiniStatement}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                activePanel === 'mini'
                  ? 'bg-novbank-800 text-white border-novbank-800'
                  : 'border-gray-200 text-gray-600 hover:border-novbank-300 hover:text-novbank-700 hover:bg-novbank-50'
              )}
            >
              <ArrowLeftRight size={13} />
              {activePanel === 'mini' ? 'Hide' : 'Mini Statement'}
            </button>
            <button
              onClick={() => togglePanel('deposit')}
              disabled={account.status !== 'active'}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                activePanel === 'deposit'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
              )}
            >
              <DollarSign size={13} />
              Deposit
            </button>
            <button
              onClick={() => togglePanel('withdraw')}
              disabled={account.status !== 'active'}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                activePanel === 'withdraw'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
              )}
            >
              <MinusCircle size={13} />
              Withdraw
            </button>
          </div>

          {/* Animated panels */}
          <AnimatePresence>
            {(activePanel === 'deposit' || activePanel === 'withdraw') && (
              <motion.div
                key={activePanel}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className={clsx(
                  'mx-4 mb-4 p-4 rounded-xl border',
                  activePanel === 'deposit' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                )}>
                  <p className={clsx('text-xs font-semibold mb-3', activePanel === 'deposit' ? 'text-emerald-700' : 'text-red-700')}>
                    {activePanel === 'deposit' ? 'Deposit to this account' : 'Withdraw from this account'}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="input pl-7 text-sm py-2"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleAction(activePanel)}
                      disabled={actionLoading || !actionAmount}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
                        activePanel === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                      )}
                    >
                      {actionLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Confirm'
                      )}
                    </button>
                    <button
                      onClick={() => { setActivePanel(null); setActionAmount('') }}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm"
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini statement panel */}
          <AnimatePresence>
            {activePanel === 'mini' && (
              <motion.div
                key="mini"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-gray-100"
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Recent Transactions</span>
                  <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600">
                    <ChevronDown size={14} />
                  </button>
                </div>
                {loadingTxns ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-5 h-5 border-2 border-novbank-600/30 border-t-novbank-600 rounded-full animate-spin" />
                  </div>
                ) : txns.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">No transactions yet</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {txns.slice(0, 5).map((txn) => {
                      const icon = getCategoryIcon(txn.category ?? txn.transaction_type)
                      const color = getCategoryColor(txn.category ?? txn.transaction_type)
                      const isCredit = txn.transaction_type === 'deposit' || txn.to_account_id === account.id
                      return (
                        <div key={txn.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors">
                          <div className={clsx('w-9 h-9 rounded-xl text-sm flex items-center justify-center shrink-0', color)}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{txn.description}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(txn.created_at)}</div>
                          </div>
                          <div className={clsx('text-xs font-bold shrink-0', isCredit ? 'text-emerald-600' : 'text-red-500')}>
                            {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScrollReveal>
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    accountsApi.getMyAccounts()
      .then(setAccounts)
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const savingsBalance = accounts.filter(a => a.account_type === 'savings').reduce((s, a) => s + a.balance, 0)
  const currentBalance = accounts.filter(a => a.account_type === 'current').reduce((s, a) => s + a.balance, 0)

  return (
    <BankingLayout>
      {/* Hero header */}
      <div className="bg-gradient-to-br from-novbank-950 via-novbank-900 to-novbank-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-novbank-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 px-6 lg:px-10 py-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-novbank-gold/20 border border-novbank-gold/30 flex items-center justify-center">
                    <Landmark size={20} className="text-novbank-gold" />
                  </div>
                  <div>
                    <div className="text-white/50 text-xs uppercase tracking-widest">Portfolio</div>
                    <h1 className="text-white font-bold text-xl">My Accounts</h1>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Total Balance</div>
                  <div className="text-4xl font-bold text-white">{formatINR(totalBalance)}</div>
                </div>
              </div>

              {!loading && accounts.length > 0 && (
                <div className="flex gap-3">
                  <div className="glass rounded-2xl px-5 py-3 text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <TrendingUp size={12} className="text-emerald-400" />
                      <span className="text-white/50 text-[10px] uppercase tracking-widest">Savings</span>
                    </div>
                    <div className="text-white font-bold text-sm">{formatINR(savingsBalance)}</div>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <TrendingDown size={12} className="text-blue-400" />
                      <span className="text-white/50 text-[10px] uppercase tracking-widest">Current</span>
                    </div>
                    <div className="text-white font-bold text-sm">{formatINR(currentBalance)}</div>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-center">
                    <div className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Accounts</div>
                    <div className="text-white font-bold text-sm">{accounts.length}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Account cards */}
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-6 mt-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-20 mt-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Landmark size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-lg">No accounts found</p>
            <p className="text-gray-400 text-sm mt-1.5">Contact your branch to open a new account</p>
          </motion.div>
        ) : (
          <div className="space-y-6 mt-6">
            {accounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>
        )}
      </div>
    </BankingLayout>
  )
}
