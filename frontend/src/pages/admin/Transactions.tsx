import { useEffect, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/admin'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { formatINR, formatDateTime, getModeBadge } from '../../utils/formatters'
import type { Transaction } from '../../types'
import clsx from 'clsx'

const TYPE_COLORS: Record<string, string> = {
  deposit: 'bg-emerald-100 text-emerald-700',
  withdrawal: 'bg-red-100 text-red-700',
  transfer: 'bg-blue-100 text-blue-700',
  credit: 'bg-purple-100 text-purple-700',
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getTransactions()
      .then(setTransactions)
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.transaction_type === filter)
  const totalVolume = filtered.reduce((s, t) => s + t.amount, 0)

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">All Transactions</h1>
              <p className="text-gray-500 text-sm">Full bank audit trail</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'deposit', 'withdrawal', 'transfer'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={clsx(
                    'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
                    filter === type
                      ? 'bg-novbank-800 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">
              <span className="font-semibold text-gray-900">{filtered.length}</span> transactions ·{' '}
              <span className="font-semibold text-gray-900">{formatINR(totalVolume)}</span> total
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : (
          <ScrollReveal>
            <div className="card p-0 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['ID', 'Type', 'Mode', 'From → To', 'Description', 'Date', 'Amount', 'Status'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((txn) => {
                        const modeBadge = txn.transfer_mode ? getModeBadge(txn.transfer_mode) : null
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{txn.id}</td>
                            <td className="px-4 py-3">
                              <span className={clsx(
                                'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                                TYPE_COLORS[txn.transaction_type] ?? 'bg-gray-100 text-gray-600'
                              )}>
                                {txn.transaction_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {modeBadge ? (
                                <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', modeBadge)}>
                                  {txn.transfer_mode}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">
                              {txn.from_account_id ?? '—'} → {txn.to_account_id ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{txn.description}</td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(txn.created_at)}</td>
                            <td className={clsx(
                                'px-4 py-3 text-xs font-semibold',
                                txn.transaction_type === 'deposit' || txn.transaction_type === 'credit'
                                  ? 'text-emerald-600'
                                  : txn.transaction_type === 'withdrawal'
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              )}>
                              {txn.transaction_type === 'deposit' || txn.transaction_type === 'credit' ? '+' : txn.transaction_type === 'withdrawal' ? '-' : ''}{formatINR(txn.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={clsx(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                txn.status === 'completed' || txn.status === 'success'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              )}>
                                {txn.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </BankingLayout>
  )
}
