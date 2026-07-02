import { useEffect, useState } from 'react'
import { ArrowLeftRight, Download, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { transactionsApi } from '../../api/transactions'
import { accountsApi } from '../../api/accounts'
import { reportsApi } from '../../api/reports'
import { formatINR, formatDateTime, getCategoryIcon, getCategoryColor, getModeBadge } from '../../utils/formatters'
import type { Account, Transaction } from '../../types'
import clsx from 'clsx'

const PAGE_SIZE = 20

const CATEGORIES = ['All', 'food', 'shopping', 'travel', 'utilities', 'entertainment', 'healthcare', 'salary', 'transfer', 'other']
const TYPES = ['All', 'deposit', 'withdrawal', 'transfer', 'credit', 'debit']

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [type, setType] = useState('All')
  const [category, setCategory] = useState('All')
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    accountsApi.getMyAccounts()
      .then(setAccounts)
      .catch(() => {})
  }, [])

  function loadTransactions() {
    setLoading(true)
    setPage(0)
    transactionsApi.getMyTransactions({
      date_from: fromDate || undefined,
      date_to: toDate || undefined,
      transaction_type: type !== 'All' ? type : undefined,
      category: category !== 'All' ? category : undefined,
      account_id: accountId ? Number(accountId) : undefined,
    })
      .then(setTransactions)
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  function resetFilters() {
    setFromDate('')
    setToDate('')
    setType('All')
    setCategory('All')
    setAccountId('')
  }

  const hasActiveFilters = fromDate || toDate || type !== 'All' || category !== 'All' || accountId

  const paginated = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE)

  function handleDownloadCSV() {
    const url = reportsApi.getCSVDownloadUrl({
      date_from: fromDate || undefined,
      date_to: toDate || undefined,
      transaction_type: type !== 'All' ? type : undefined,
      category: category !== 'All' ? category : undefined,
      account_id: accountId ? Number(accountId) : undefined,
    })
    window.open(url, '_blank')
    toast.success('Download started')
  }

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Page header */}
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
                <ArrowLeftRight size={20} className="text-novbank-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-sm">{transactions.length} transactions</span>
                  {hasActiveFilters && (
                    <span className="bg-novbank-100 text-novbank-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Filtered
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download size={14} />
              Download CSV
            </button>
          </div>
        </ScrollReveal>

        {/* Sticky filter bar */}
        <ScrollReveal delay={0.05}>
          <div className="card mb-6 sticky top-4 z-10 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Filters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="label text-xs">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
              <div>
                <label className="label text-xs">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input text-sm py-2"
                />
              </div>
              <div>
                <label className="label text-xs">Account</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input text-sm py-2">
                  <option value="">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      ••••{a.account_number.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="input text-sm py-2 capitalize">
                  {TYPES.map((t) => <option key={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input text-sm py-2 capitalize">
                  {CATEGORIES.map((c) => <option key={c} className="capitalize">{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={loadTransactions} className="btn-primary flex items-center gap-2 text-sm py-2.5">
                <Search size={14} />
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => { resetFilters() }}
                  className="btn-secondary flex items-center gap-2 text-sm py-2.5"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Transaction list */}
        <ScrollReveal delay={0.1}>
          {loading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : paginated.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <ArrowLeftRight size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1.5 mb-5">Try adjusting your filters or date range</p>
              {hasActiveFilters && (
                <button
                  onClick={() => { resetFilters(); loadTransactions() }}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="card p-0 overflow-hidden">
              {/* Transaction items */}
              <div className="divide-y divide-gray-50">
                {paginated.map((txn, idx) => {
                  const icon = getCategoryIcon(txn.category ?? txn.transaction_type)
                  const colorClass = getCategoryColor(txn.category ?? txn.transaction_type)
                  const isCredit = txn.transaction_type === 'deposit' || txn.transaction_type === 'credit'
                  const modeBadge = txn.transfer_mode ? getModeBadge(txn.transfer_mode) : null

                  return (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Category icon */}
                      <div className={clsx(
                        'w-11 h-11 rounded-2xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105',
                        colorClass
                      )}>
                        {icon}
                      </div>

                      {/* Description + date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {txn.beneficiary_name ?? txn.description ?? txn.transaction_type}
                          </span>
                          {modeBadge ? (
                            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide', modeBadge)}>
                              {txn.transfer_mode}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0 capitalize">
                              {txn.transaction_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span>{formatDateTime(txn.created_at)}</span>
                          {txn.description && txn.beneficiary_name && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[160px]">{txn.description}</span>
                            </>
                          )}
                          {txn.reference_number && (
                            <>
                              <span>·</span>
                              <span className="font-mono">{txn.reference_number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount + status */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={clsx(
                          'text-sm font-bold',
                          isCredit ? 'text-emerald-600' : 'text-gray-800'
                        )}>
                          {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                        </span>
                        <span className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                          txn.status === 'completed' || txn.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : txn.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        )}>
                          {txn.status}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                  <span className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, transactions.length)}</span> of <span className="font-semibold text-gray-700">{transactions.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm text-gray-700 font-semibold bg-novbank-800 text-white rounded-lg">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>
      </div>
    </BankingLayout>
  )
}
