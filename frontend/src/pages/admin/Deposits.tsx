import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { depositsApi, type DepositRequestOut } from '../../api/deposits'
import { formatINR, formatDateTime } from '../../utils/formatters'
import clsx from 'clsx'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_CFG = {
  pending:  { label: 'Pending',  bg: 'bg-amber-100 text-amber-800',  icon: <Clock size={11} /> },
  approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-700',      icon: <XCircle size={11} /> },
}

function DenomDetail({ req }: { req: DepositRequestOut }) {
  const [open, setOpen] = useState(false)
  const d = req.denominations
  if (!d || Object.values(d).every(v => v === 0)) return null
  const entries = Object.entries(d).filter(([, v]) => v > 0)
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-[10px] text-novbank-600 font-medium hover:underline"
      >
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {open ? 'Hide' : 'Details'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-1.5"
          >
            <div className="bg-gray-50 rounded-lg p-2 space-y-0.5">
              {entries.map(([denom, count]) => (
                <div key={denom} className="flex justify-between text-[11px]">
                  <span className="text-gray-500">₹{denom} × {count}</span>
                  <span className="font-medium text-gray-700">₹{(Number(denom) * Number(count)).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RejectModal({
  req,
  onClose,
  onRejected,
}: {
  req: DepositRequestOut | null
  onClose: () => void
  onRejected: (updated: DepositRequestOut) => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!req) return
    setLoading(true)
    try {
      const updated = await depositsApi.adminReject(req.id, note || undefined)
      toast.success('Deposit request rejected')
      onRejected(updated)
      setNote('')
      onClose()
    } catch {
      toast.error('Failed to reject request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {req && (
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
              <h3 className="font-bold text-gray-900">Reject Deposit Request</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {req.user_name} — {formatINR(req.amount)}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <label className="block text-sm text-gray-600 font-medium">Reason (optional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input resize-none text-sm"
                placeholder="e.g. Denomination mismatch, please re-submit"
              />
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleReject}
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

export default function AdminDeposits() {
  const [requests, setRequests] = useState<DepositRequestOut[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<DepositRequestOut | null>(null)

  function load(status: FilterStatus) {
    setLoading(true)
    depositsApi.adminList(status)
      .then(setRequests)
      .catch(() => toast.error('Failed to load deposit requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(filter) }, [filter])

  async function handleApprove(req: DepositRequestOut) {
    setApprovingId(req.id)
    try {
      const updated = await depositsApi.adminApprove(req.id)
      toast.success(`₹${req.amount.toLocaleString('en-IN')} deposit approved for ${req.user_name}`)
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApprovingId(null)
    }
  }

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }
  const pendingTotal = requests
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.amount, 0)

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Banknote size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Deposit Requests</h1>
                <p className="text-gray-500 text-sm">Review and approve customer cash deposits</p>
              </div>
            </div>
            <button
              onClick={() => load(filter)}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
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
              <div className="text-2xl font-bold text-amber-700">{counts.pending}</div>
              {pendingTotal > 0 && <div className="text-xs text-amber-600 mt-0.5">{formatINR(pendingTotal)} awaiting</div>}
            </div>
            <div className="card p-4 border-l-4 border-emerald-400">
              <div className="text-xs text-gray-500 mb-1">Approved (shown)</div>
              <div className="text-2xl font-bold text-emerald-700">{counts.approved}</div>
            </div>
            <div className="card p-4 border-l-4 border-red-400">
              <div className="text-xs text-gray-500 mb-1">Rejected (shown)</div>
              <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
            </div>
          </div>
        </ScrollReveal>

        {/* Filter tabs */}
        <ScrollReveal delay={0.06}>
          <div className="flex gap-2 mb-5 flex-wrap">
            {(['pending', 'approved', 'rejected', 'all'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors',
                  filter === s
                    ? 'bg-novbank-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : requests.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <Banknote size={36} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No deposit requests found</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <ScrollReveal delay={0.08}>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['#', 'Customer', 'Account', 'Amount & Notes', 'Submitted', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {requests.map(req => {
                      const cfg = STATUS_CFG[req.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending
                      const isPending = req.status === 'pending'
                      return (
                        <tr key={req.id} className={clsx('transition-colors', isPending ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-gray-50')}>
                          <td className="px-4 py-4 text-xs text-gray-400 font-mono">#{req.id}</td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{req.user_name}</div>
                            <div className="text-xs text-gray-400">{req.user_email}</div>
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-gray-600">
                            ••••{req.account_number?.slice(-4)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-gray-900">{formatINR(req.amount)}</div>
                            <DenomDetail req={req} />
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                            {formatDateTime(req.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.bg)}>
                              {cfg.icon} {cfg.label}
                            </span>
                            {req.admin_note && (
                              <div className="text-[10px] text-gray-400 mt-1 max-w-[140px] truncate" title={req.admin_note}>
                                {req.admin_note}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isPending ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(req)}
                                  disabled={approvingId === req.id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                  {approvingId === req.id
                                    ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                    : <CheckCircle2 size={12} />
                                  }
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectTarget(req)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-600 hover:text-white text-red-700 text-xs font-semibold transition-colors"
                                >
                                  <XCircle size={12} />
                                  Reject
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
        req={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onRejected={updated => setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))}
      />
    </BankingLayout>
  )
}
