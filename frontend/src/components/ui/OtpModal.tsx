import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'

interface Props {
  open: boolean
  mobile: string
  onVerified: () => void
  onCancel: () => void
}

export default function OtpModal({ open, mobile, onVerified, onCancel }: Props) {
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [demoOtp, setDemoOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const maskedMobile = mobile ? `+91 ••••••${mobile.slice(-4)}` : ''

  async function sendOtp() {
    if (!mobile) return
    setSending(true)
    try {
      const res = await authApi.sendOtp(mobile)
      setDemoOtp(res.demo_otp)
      setCountdown(30)
    } catch {
      toast.error('Failed to send OTP')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (open) {
      setOtp('')
      setDemoOtp('')
      sendOtp()
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 4) { toast.error('Enter the OTP'); return }
    setVerifying(true)
    try {
      await authApi.verifyOtp(mobile, otp)
      setOtp('')
      onVerified()
    } catch {
      toast.error('Invalid or expired OTP. Try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
            <div className="bg-gradient-to-r from-novbank-900 to-novbank-800 px-5 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-novbank-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">OTP Verification</h3>
                    <p className="text-white/50 text-xs mt-0.5">Sent to {maskedMobile}</p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify} className="px-5 py-5 space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter the 6-digit OTP to authorise this transaction.
              </p>

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center text-2xl font-bold tracking-[0.5em] py-4 w-full"
                placeholder="••••••"
                required
              />

              {demoOtp && (
                <div className="flex items-center justify-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-3">
                  <span>Demo OTP:</span>
                  <span className="font-bold font-mono text-sm">{demoOtp}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || otp.length < 4}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify & Proceed'
                )}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sending}
                    className="inline-flex items-center gap-1.5 text-xs text-novbank-600 font-medium hover:text-novbank-700"
                  >
                    <RefreshCw size={11} className={sending ? 'animate-spin' : ''} />
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
