import { useEffect, useState } from 'react'
import {
  Building2, CheckCircle2, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, IndianRupee,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { loanApplicationsApi, type LoanApplicationOut } from '../../api/loanApplications'
import { formatINR, formatDateTime } from '../../utils/formatters'
import clsx from 'clsx'

type Filter = 'pending' | 'approved' | 'rejected' | 'all'

const STATUS_CFG = {
  pending:  { label: 'Pending',  bg: 'bg-amber-100 text-amber-800',   icon: <Clock size={11} /> },
  approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-700',       icon: <XCircle size={11} /> },
}

const LOAN_TYPE_COLOR: Record<string, string> = {
  personal: 'bg-purple-100 text-purple-700',
  home:     'bg-emerald-100 text-emerald-700',
  auto:     'bg-blue-100 text-blue-700',
}

function DetailsExpander({ app }: { app: LoanApplicationOut }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-[10px] text-novbank-600 hover:underline font-medium"
      >
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />} {open ? 'Hide' : 'Details'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mt-1.5"
          >
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Purpose</span>
                <span className="text-gray-700 font-medium">{app.purpose ?? '—'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Monthly Income</span>
                <span className="text-gray-700 font-medium">{formatINR(app.monthly_income)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-400">Disbursal A/C</span>
                <span className="font-mono text-gray-700">••••{app.account_number?.slice(-4) ?? '—'}</span>
              </div>
              {app.loan_id && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Loan ID</span>
                  <span className="text-novbank-700 font-medium">#{app.loan_id}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RejectModal({
  app,
  onClose,
  onRejected,
}: {
  app: LoanApplicationOut | null
  onClose: () => void
  onRejected: (updated: LoanApplicationOut) => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!app) return
    setLoading(true)
    try {
      const updated = await loanApplicationsApi.adminReject(app.id, note || undefined)
      toast.success('Application rejected')
      onRejected(updated)
      setNote('')
      onClose()
    } catch {
      toast.error('Failed to reject application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.93, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Reject Loan Application</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {app.user_name} — {app.loan_type} — {formatINR(app.amount)}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <label className="block text-sm text-gray-600 font-medium">Reason (optional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input resize-none text-sm"
                placeholder="e.g. Insufficient income, credit score too low…"
              />
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminLoanApplications() {
  const [apps, setApps] = useState<LoanApplicationOut[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<LoanApplicationOut | null>(null)

  function load(f: Filter) {
    setLoading(true)
    loanApplicationsApi.adminList(f)
      .then(setApps)
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(filter) }, [filter])

  async function handleApprove(app: LoanApplicationOut) {
    setApprovingId(app.id)
    try {
      const updated = await loanApplicationsApi.adminApprove(app.id)
      toast.success(`${app.loan_type} loan of ${formatINR(app.amount)} approved & disbursed to ${app.user_name}`)
      setApps(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApprovingId(null)
    }
  }

  const pending  = apps.filter(a => a.status === 'pending').length
  const approved = apps.filter(a => a.status === 'approved').length
  const rejected = apps.filter(a => a.status === 'rejected').length
  const pendingAmt = apps.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0)

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Loan Applications</h1>
                <p className="text-gray-500 text-sm">Review, approve or reject customer loan requests</p>
              </div>
            </div>
            <button
              onClick={() => load(filter)}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </ScrollReveal>

        {/* Summary cards */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 border-l-4 border-amber-400">
              <div className="text-xs text-gray-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-700">{pending}</div>
              {pendingAmt > 0 && <div className="text-xs text-amber-600 mt-0.5">{formatINR(pendingAmt)} requested</div>}
            </div>
            <div className="card p-4 border-l-4 border-emerald-400">
              <div className="text-xs text-gray-500 mb-1">Approved</div>
              <div className="text-2xl font-bold text-emerald-700">{approved}</div>
            </div>
            <div className="card p-4 border-l-4 border-red-400">
              <div className="text-xs text-gray-500 mb-1">Rejected</div>
              <div className="text-2xl font-bold text-red-700">{rejected}</div>
            </div>
          </div>
        </ScrollReveal>

        {/* Filter tabs */}
        <ScrollReveal delay={0.06}>
          <div className="flex gap-2 mb-5 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
                  filter === f
                    ? 'bg-novbank-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : apps.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <Building2 size={36} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No loan applications</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <ScrollReveal delay={0.08}>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['#', 'Customer', 'Type', 'Amount & Tenure', 'EMI', 'Applied', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {apps.map(app => {
                      const cfg = STATUS_CFG[app.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
                      const isPending = app.status === 'pending'
                      return (
                        <tr key={app.id} className={clsx('transition-colors', isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-gray-50')}>
                          <td className="px-4 py-4 text-xs font-mono text-gray-400">#{app.id}</td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{app.user_name}</div>
                            <div className="text-xs text-gray-400">{app.user_email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize', LOAN_TYPE_COLOR[app.loan_type] ?? 'bg-gray-100 text-gray-700')}>
                              {app.loan_type}
                            </span>
                            <div className="text-[10px] text-gray-400 mt-1">{app.interest_rate}% p.a.</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                              <IndianRupee size={11} className="text-gray-500" />
                              {app.amount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{app.tenure_months} months</div>
                            <DetailsExpander app={app} />
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-novbank-700">
                            {app.emi_amount ? formatINR(app.emi_amount) : '—'}
                            <div className="text-[10px] text-gray-400 font-normal">/month</div>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                            {formatDateTime(app.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.bg)}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {app.admin_note && (
                              <div className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate" title={app.admin_note}>
                                {app.admin_note}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isPending ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(app)}
                                  disabled={approvingId === app.id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                  {approvingId === app.id
                                    ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    : <CheckCircle2 size={12} />
                                  }
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectTarget(app)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-600 hover:text-white text-red-700 text-xs font-semibold transition-colors"
                                >
                                  <XCircle size={12} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      <RejectModal
        app={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onRejected={updated => setApps(prev => prev.map(a => a.id === updated.id ? updated : a))}
      />
    </BankingLayout>
  )
}
