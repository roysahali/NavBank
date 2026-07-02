import { useEffect, useState } from 'react'
import {
  ShieldCheck, RefreshCw, Search, UserCheck, UserX, Lock, Unlock,
  Banknote, CheckCircle2, XCircle, Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { auditApi, type AuditLogEntry } from '../../api/audit'
import { formatDateTime } from '../../utils/formatters'
import clsx from 'clsx'

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create_user:       { label: 'Create User',      icon: <Plus size={12} />,        color: 'bg-blue-100 text-blue-700' },
  update_user:       { label: 'Update User',      icon: <UserCheck size={12} />,    color: 'bg-violet-100 text-violet-700' },
  delete_user:       { label: 'Delete User',      icon: <Trash2 size={12} />,       color: 'bg-red-100 text-red-700' },
  activate_user:     { label: 'Activate User',    icon: <UserCheck size={12} />,    color: 'bg-emerald-100 text-emerald-700' },
  deactivate_user:   { label: 'Deactivate User',  icon: <UserX size={12} />,        color: 'bg-orange-100 text-orange-700' },
  freeze_account:    { label: 'Freeze Account',   icon: <Lock size={12} />,         color: 'bg-sky-100 text-sky-700' },
  unfreeze_account:  { label: 'Unfreeze Account', icon: <Unlock size={12} />,       color: 'bg-teal-100 text-teal-700' },
  admin_deposit:     { label: 'Admin Deposit',    icon: <Banknote size={12} />,     color: 'bg-amber-100 text-amber-700' },
  approve_deposit:   { label: 'Approve Deposit',  icon: <CheckCircle2 size={12} />, color: 'bg-emerald-100 text-emerald-800' },
  reject_deposit:    { label: 'Reject Deposit',   icon: <XCircle size={12} />,      color: 'bg-red-100 text-red-700' },
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action] ?? { label: action, icon: <ShieldCheck size={12} />, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', meta.color)}>
      {meta.icon}
      {meta.label}
    </span>
  )
}

function DetailsExpander({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false)
  if (!entry.details) return null
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-[10px] text-novbank-600 hover:underline font-medium"
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
            transition={{ duration: 0.18 }}
            className="overflow-hidden mt-1"
          >
            <pre className="bg-gray-50 rounded-lg p-2 text-[10px] text-gray-600 leading-relaxed overflow-x-auto">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ENTITY_FILTERS = ['all', 'user', 'account', 'deposit_request', 'transaction']

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  function load() {
    setLoading(true)
    auditApi.list({ limit: 200 })
      .then(setLogs)
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = logs.filter(l => {
    const matchEntity = entityFilter === 'all' || l.entity_type === entityFilter
    const q = search.toLowerCase()
    const matchSearch = !q || l.action.includes(q) || (l.summary ?? '').toLowerCase().includes(q) ||
      (l.admin_name ?? '').toLowerCase().includes(q)
    return matchEntity && matchSearch
  })

  return (
    <BankingLayout isAdmin>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
                <ShieldCheck size={20} className="text-novbank-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
                <p className="text-gray-500 text-sm">Complete trail of all admin actions</p>
              </div>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </ScrollReveal>

        {/* Summary strip */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {Object.entries(ACTION_META).slice(0, 5).map(([action, meta]) => {
              const count = logs.filter(l => l.action === action).length
              return (
                <div key={action} className="card p-3 flex items-center gap-2">
                  <span className={clsx('p-1.5 rounded-lg', meta.color)}>{meta.icon}</span>
                  <div>
                    <div className="text-[10px] text-gray-400">{meta.label}</div>
                    <div className="text-base font-bold text-gray-800">{count}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.06}>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions, admin, summary…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 text-sm py-2"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {ENTITY_FILTERS.map(ef => (
                <button
                  key={ef}
                  onClick={() => setEntityFilter(ef)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors',
                    entityFilter === ef
                      ? 'bg-novbank-800 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {ef === 'deposit_request' ? 'Deposits' : ef}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <ShieldCheck size={36} className="mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No audit entries found</p>
            <p className="text-sm mt-1">Actions will appear here as admins perform them</p>
          </div>
        ) : (
          <ScrollReveal delay={0.08}>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['#', 'Timestamp', 'Admin', 'Action', 'Entity', 'Summary'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">#{log.id}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{log.admin_name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{log.admin_email ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {log.entity_type ? (
                            <span className="capitalize">
                              {log.entity_type.replace('_', ' ')}
                              {log.entity_id ? <span className="text-gray-300 ml-1">#{log.entity_id}</span> : null}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700">{log.summary ?? '—'}</div>
                          <DetailsExpander entry={log} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 bg-gray-50">
                Showing {filtered.length} of {logs.length} entries
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </BankingLayout>
  )
}
