import { useEffect, useState } from 'react'
import { FileText, Download, Search, Filter, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { reportsApi, type ReportParams } from '../../api/reports'
import { accountsApi } from '../../api/accounts'
import { formatINR, formatDateTime, getCategoryIcon, getCategoryColor, getModeBadge } from '../../utils/formatters'
import type { Account, Transaction } from '../../types'
import clsx from 'clsx'

const CATEGORIES = ['', 'food', 'shopping', 'travel', 'utilities', 'entertainment', 'healthcare', 'salary', 'transfer', 'other']
const TYPES = ['', 'deposit', 'withdrawal', 'transfer', 'credit', 'debit']

export default function Reports() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [results, setResults] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const [params, setParams] = useState<ReportParams>({
    date_from: '',
    date_to: '',
    account_id: undefined,
    category: '',
    transaction_type: '',
  })

  useEffect(() => {
    accountsApi.getMyAccounts()
      .then(setAccounts)
      .catch(() => {})
  }, [])

  function set(field: keyof ReportParams) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      setParams((p) => ({ ...p, [field]: value === '' ? undefined : field === 'account_id' ? Number(value) : value }))
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGenerated(false)
    try {
      const cleanParams: ReportParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ) as ReportParams
      const data = await reportsApi.getTransactionsReport(cleanParams)
      setResults(data)
      setGenerated(true)
      toast.success(`Report generated: ${data.length} transactions`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    const cleanParams: ReportParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as ReportParams
    const url = reportsApi.getCSVDownloadUrl(cleanParams)
    window.open(url, '_blank')
    toast.success('Download started')
  }

  function handlePrint() {
    window.print()
  }

  const totalCredit = results.filter((t) => t.transaction_type === 'deposit' || t.transaction_type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebit = results.filter((t) => t.transaction_type !== 'deposit' && t.transaction_type !== 'credit').reduce((s, t) => s + t.amount, 0)

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Account Statement</h1>
              <p className="text-gray-500 text-sm">Generate and download your transaction reports</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Filter form */}
        <ScrollReveal delay={0.05}>
          <form onSubmit={handleGenerate} className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Report Parameters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">From Date</label>
                <input
                  type="date"
                  value={params.date_from ?? ''}
                  onChange={set('date_from')}
                  className="input"
                />
              </div>
              <div>
                <label className="label">To Date</label>
                <input
                  type="date"
                  value={params.date_to ?? ''}
                  onChange={set('date_to')}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Account</label>
                <select
                  value={params.account_id ?? ''}
                  onChange={set('account_id')}
                  className="input"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      ••••{a.account_number.slice(-4)} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Transaction Type</label>
                <select value={params.transaction_type ?? ''} onChange={set('transaction_type')} className="input capitalize">
                  <option value="">All Types</option>
                  {TYPES.filter(Boolean).map((t) => (
                    <option key={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select value={params.category ?? ''} onChange={set('category')} className="input capitalize">
                  <option value="">All Categories</option>
                  {CATEGORIES.filter(Boolean).map((c) => (
                    <option key={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                Generate Report
              </button>
              {generated && (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Printer size={14} />
                    Print
                  </button>
                </>
              )}
            </div>
          </form>
        </ScrollReveal>

        {/* Results */}
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : generated ? (
          <ScrollReveal delay={0.1}>
            {/* Summary cards */}
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="card py-4">
                  <div className="text-xs text-gray-400 mb-1">Total Transactions</div>
                  <div className="text-xl font-bold text-gray-900">{results.length}</div>
                </div>
                <div className="card py-4 bg-emerald-50 border-emerald-100">
                  <div className="text-xs text-emerald-600 mb-1">Total Credits</div>
                  <div className="text-xl font-bold text-emerald-700">{formatINR(totalCredit)}</div>
                </div>
                <div className="card py-4 bg-red-50 border-red-100">
                  <div className="text-xs text-red-600 mb-1">Total Debits</div>
                  <div className="text-xl font-bold text-red-700">{formatINR(totalDebit)}</div>
                </div>
              </div>
            )}

            <div className="card p-0 overflow-hidden print:shadow-none">
              {/* Print header */}
              <div className="hidden print:block px-6 py-4 border-b border-gray-200">
                <div className="text-xl font-bold text-gray-900">NovBank — Account Statement</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Generated: {new Date().toLocaleString('en-IN')}
                  {params.date_from && ` · From: ${params.date_from}`}
                  {params.date_to && ` · To: ${params.date_to}`}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText size={36} className="mb-3 opacity-40" />
                  <p className="font-medium text-gray-500">No transactions found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full print:text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 print:bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Transaction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Debit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {results.map((txn) => {
                        const icon = getCategoryIcon(txn.category ?? txn.transaction_type)
                        const colorClass = getCategoryColor(txn.category ?? txn.transaction_type)
                        const isCredit = txn.transaction_type === 'deposit' || txn.transaction_type === 'credit'
                        const modeBadge = txn.transfer_mode ? getModeBadge(txn.transfer_mode) : null
                        return (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className={clsx('w-8 h-8 rounded-lg text-sm flex items-center justify-center shrink-0 print:hidden', colorClass)}>
                                  {icon}
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-gray-900">
                                    {txn.beneficiary_name ?? txn.description ?? txn.transaction_type}
                                  </div>
                                  {txn.category && (
                                    <div className="text-[10px] text-gray-400 capitalize">{txn.category}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {modeBadge ? (
                                <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', modeBadge)}>
                                  {txn.transfer_mode}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 capitalize">{txn.transaction_type}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-500">{formatDateTime(txn.created_at)}</td>
                            <td className="px-4 py-3.5">
                              <span className="text-[10px] font-mono text-gray-400">{txn.reference_number ?? '—'}</span>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-medium text-right text-red-600">
                              {!isCredit ? formatINR(txn.amount) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-medium text-right text-emerald-600">
                              {isCredit ? formatINR(txn.amount) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t border-gray-200 bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-700">Total</td>
                        <td className="px-4 py-3 text-xs font-bold text-right text-red-600">{formatINR(totalDebit)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-right text-emerald-600">{formatINR(totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </ScrollReveal>
        ) : null}
      </div>
    </BankingLayout>
  )
}
