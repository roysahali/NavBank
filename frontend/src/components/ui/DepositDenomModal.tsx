import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, X, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'

export interface DenomValues {
  notes_100: number
  notes_200: number
  notes_500: number
}

interface Props {
  open: boolean
  accountLabel: string
  onConfirm: (denoms: DenomValues, total: number) => void
  onCancel: () => void
}

const DENOMS: { key: keyof DenomValues; value: number; label: string; color: string }[] = [
  { key: 'notes_100', value: 100, label: '₹100', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'notes_200', value: 200, label: '₹200', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'notes_500', value: 500, label: '₹500', color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

export default function DepositDenomModal({ open, accountLabel, onConfirm, onCancel }: Props) {
  const [denoms, setDenoms] = useState<DenomValues>({
    notes_100: 0, notes_200: 0, notes_500: 0,
  })

  const total =
    denoms.notes_100 * 100 +
    denoms.notes_200 * 200 +
    denoms.notes_500 * 500

  function set(key: keyof DenomValues, raw: string) {
    const n = Math.max(0, parseInt(raw) || 0)
    setDenoms(prev => ({ ...prev, [key]: n }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (total <= 0) return
    onConfirm(denoms, total)
    setDenoms({ notes_100: 0, notes_200: 0, notes_500: 0 })
  }

  function handleCancel() {
    setDenoms({ notes_100: 0, notes_200: 0, notes_500: 0 })
    onCancel()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-novbank-900 to-novbank-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-novbank-gold/20 border border-novbank-gold/30 flex items-center justify-center">
                  <Banknote size={18} className="text-novbank-gold" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Cash Deposit Request</p>
                  <p className="text-white/50 text-xs">{accountLabel}</p>
                </div>
              </div>
              <button onClick={handleCancel} className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5">
              <p className="text-xs text-gray-500 mb-4">
                Enter the number of notes for each denomination. Admin will review and approve your request.
              </p>

              {/* Denomination table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {DENOMS.map(({ key, value, label, color }) => {
                      const count = denoms[key]
                      const sub = count * value
                      return (
                        <tr key={key} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold', color)}>
                              <Banknote size={11} />
                              {label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={count === 0 ? '' : count}
                              onChange={e => set(key, e.target.value)}
                              placeholder="0"
                              className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-novbank-400 focus:border-novbank-400"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={clsx('text-sm font-semibold', sub > 0 ? 'text-novbank-700' : 'text-gray-300')}>
                              {sub > 0 ? `₹${sub.toLocaleString('en-IN')}` : '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-novbank-50 border-t-2 border-novbank-200">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-novbank-900" colSpan={2}>Total Deposit Amount</td>
                      <td className="px-4 py-3 text-right">
                        <span className={clsx('text-base font-bold', total > 0 ? 'text-novbank-700' : 'text-gray-400')}>
                          {total > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {total > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                  <ShieldCheck size={13} className="shrink-0" />
                  Your deposit of ₹{total.toLocaleString('en-IN')} will be credited after admin approval.
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={total <= 0}
                  className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
