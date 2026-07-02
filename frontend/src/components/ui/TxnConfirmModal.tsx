import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X } from 'lucide-react'
import clsx from 'clsx'

export interface ConfirmRow {
  label: string
  value: string
  highlight?: boolean
}

interface Props {
  open: boolean
  title: string
  rows: ConfirmRow[]
  onConfirm: () => void
  onCancel: () => void
}

export default function TxnConfirmModal({ open, title, rows, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-novbank-50 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-novbank-700" />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Rows */}
            <div className="px-5 py-2 divide-y divide-gray-50">
              {rows.map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={clsx(
                    'font-semibold',
                    highlight
                      ? 'text-lg text-novbank-700 font-bold'
                      : 'text-sm text-gray-900'
                  )}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={onConfirm} className="btn-primary flex-1">
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
