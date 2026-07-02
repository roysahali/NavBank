import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Phone, MessageCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  open: boolean
  message?: string
  onClose: () => void
}

export default function AccountFrozenModal({ open, message, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 px-6 py-6 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-3">
                <Lock size={30} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-lg">Account Frozen</h2>
              <p className="text-white/70 text-xs mt-1">This account has been temporarily restricted</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed text-center">
                {message && !message.toLowerCase().includes('frozen')
                  ? message
                  : 'Your account has been frozen by NovBank. All transactions are suspended until the account is reactivated.'}
              </p>

              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-red-800">What you can do:</p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Contact your branch manager</li>
                  <li>Call NovBank helpline: <strong>1800-XXX-XXXX</strong></li>
                  <li>Raise a support ticket from your account</li>
                </ul>
              </div>

              <div className="flex gap-3 mt-5">
                <Link
                  to="/support"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle size={14} /> Support
                </Link>
                <a
                  href="tel:1800XXXXXXX"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <Phone size={14} /> Call Us
                </a>
              </div>

              <button
                onClick={onClose}
                className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
