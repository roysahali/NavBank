import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Plus, Trash2, CheckCircle2, Send, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import TxnConfirmModal from '../../components/ui/TxnConfirmModal'
import OtpModal from '../../components/ui/OtpModal'
import { upiApi } from '../../api/upi'
import { accountsApi } from '../../api/accounts'
import { formatINR, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import type { UpiVpa, UpiTransaction, Account } from '../../types'
import clsx from 'clsx'

export default function UPI() {
  const { user } = useAuth()
  const [vpas, setVpas] = useState<UpiVpa[]>([])
  const [upiTxns, setUpiTxns] = useState<UpiTransaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'vpas' | 'pay' | 'history'>('vpas')

  // Add VPA
  const [newVpa, setNewVpa] = useState('')
  const [newVpaAccount, setNewVpaAccount] = useState('')
  const [addingVpa, setAddingVpa] = useState(false)
  const [showAddVpa, setShowAddVpa] = useState(false)

  // Pay
  const [senderVpa, setSenderVpa] = useState('')
  const [receiverVpa, setReceiverVpa] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [note, setNote] = useState('')
  const [paying, setPaying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOtp, setShowOtp] = useState(false)

  useEffect(() => {
    Promise.all([
      upiApi.getVPAs(),
      upiApi.getUPITransactions(),
      accountsApi.getMyAccounts(),
    ]).then(([v, t, a]) => {
      setVpas(v)
      setUpiTxns(t)
      setAccounts(a.filter((acc) => acc.status === 'active'))
      if (a.length > 0) setNewVpaAccount(String(a[0].id))
    }).catch(() => toast.error('Failed to load UPI data'))
      .finally(() => setLoading(false))
  }, [])

  async function addVPA(e: React.FormEvent) {
    e.preventDefault()
    if (!newVpa.includes('@')) { toast.error('Enter a valid UPI VPA (e.g. name@upi)'); return }
    setAddingVpa(true)
    try {
      const created = await upiApi.createVPA({ vpa: newVpa, linked_account_id: Number(newVpaAccount) })
      setVpas((p) => [...p, created])
      setNewVpa('')
      setShowAddVpa(false)
      toast.success('UPI VPA registered successfully!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add VPA')
    } finally {
      setAddingVpa(false)
    }
  }

  async function deleteVPA(id: number) {
    try {
      await upiApi.deleteVPA(id)
      setVpas((p) => p.filter((v) => v.id !== id))
      toast.success('VPA removed')
    } catch {
      toast.error('Failed to remove VPA')
    }
  }

  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  async function handleReceiverVpaChange(value: string) {
    setReceiverVpa(value)
    setResolvedName('')
    setResolveError('')
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current)
    if (value.includes('@') && value.length > 4) {
      resolveTimerRef.current = setTimeout(async () => {
        setResolving(true)
        try {
          const res = await upiApi.resolveVPA(value)
          if (res.name) {
            setResolvedName(res.name)
          } else {
            setResolveError('VPA not found or invalid')
          }
        } catch {
          setResolveError('Could not verify VPA')
        } finally {
          setResolving(false)
        }
      }, 700)
    }
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!senderVpa) { toast.error('Select a sender VPA'); return }
    if (!receiverVpa.includes('@')) { toast.error('Enter a valid receiver VPA'); return }
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setShowConfirm(true)
  }

  async function executePay() {
    const amt = parseFloat(payAmount)
    setPaying(true)
    try {
      await upiApi.payUPI({ sender_vpa: senderVpa, receiver_vpa: receiverVpa, amount: amt, note: note || undefined })
      toast.success(`₹${amt.toLocaleString('en-IN')} sent to ${receiverVpa}`)
      setSenderVpa('')
      setReceiverVpa('')
      setResolvedName('')
      setPayAmount('')
      setNote('')
      upiApi.getUPITransactions().then(setUpiTxns)
      setTab('history')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Smartphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">UPI Payments</h1>
              <p className="text-gray-500 text-sm">Instant payments 24×7</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
          {[
            { key: 'vpas', label: 'My VPAs' },
            { key: 'pay', label: 'Send Money' },
            { key: 'history', label: 'History' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={clsx(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonCard />
        ) : (
          <AnimatePresence mode="wait">
            {/* VPAs tab */}
            {tab === 'vpas' && (
              <motion.div key="vpas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700">Registered UPI IDs</h2>
                    <button
                      onClick={() => setShowAddVpa(!showAddVpa)}
                      className="flex items-center gap-1.5 text-xs text-novbank-600 font-medium hover:text-novbank-700"
                    >
                      {showAddVpa ? <X size={12} /> : <Plus size={12} />}
                      {showAddVpa ? 'Cancel' : 'Add VPA'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddVpa && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={addVPA}
                        className="overflow-hidden"
                      >
                        <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                          <input
                            type="text"
                            value={newVpa}
                            onChange={(e) => setNewVpa(e.target.value.toLowerCase().replace(/\s/g, ''))}
                            className="input"
                            placeholder="yourname@upi"
                            required
                          />
                          <select
                            value={newVpaAccount}
                            onChange={(e) => setNewVpaAccount(e.target.value)}
                            className="input"
                            required
                          >
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                ••••{a.account_number.slice(-4)} — {a.account_type}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={addingVpa}
                            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
                          >
                            {addingVpa ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              'Register VPA'
                            )}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {vpas.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No UPI IDs registered yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vpas.map((vpa) => {
                        const linkedAccount = accounts.find((a) => a.id === vpa.linked_account_id)
                        return (
                          <div key={vpa.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Smartphone size={16} className="text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {vpa.vpa}
                                {vpa.is_primary && (
                                  <span className="text-[10px] bg-novbank-100 text-novbank-700 px-1.5 py-0.5 rounded-full font-semibold">PRIMARY</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                Linked: ••••{linkedAccount?.account_number.slice(-4)} · {linkedAccount?.account_type}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={clsx(
                                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                vpa.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              )}>
                                {vpa.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => deleteVPA(vpa.id)}
                                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pay tab */}
            {tab === 'pay' && (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handlePay} className="card space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700">Send via UPI</h2>

                  <div>
                    <label className="label">Send From (Your VPA)</label>
                    <select value={senderVpa} onChange={(e) => setSenderVpa(e.target.value)} className="input" required>
                      <option value="">Select your UPI ID</option>
                      {vpas.filter((v) => v.is_active).map((v) => (
                        <option key={v.id} value={v.vpa}>{v.vpa}</option>
                      ))}
                    </select>
                    {vpas.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">Register a UPI VPA first from the "My VPAs" tab</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Pay To (Receiver VPA)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={receiverVpa}
                        onChange={(e) => handleReceiverVpaChange(e.target.value)}
                        className="input pr-8"
                        placeholder="receiver@upi"
                        required
                      />
                      {resolving && (
                        <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                      )}
                    </div>
                    {resolvedName && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle2 size={12} />
                        <span className="font-medium">{resolvedName}</span>
                      </div>
                    )}
                    {resolveError && (
                      <div className="mt-1.5 text-xs text-red-500">{resolveError}</div>
                    )}
                    {resolving && (
                      <div className="mt-1.5 text-xs text-gray-400">Verifying VPA...</div>
                    )}
                  </div>

                  <div>
                    <label className="label">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        step="1"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="input pl-8 text-lg font-semibold"
                        placeholder="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">UPI limit: ₹1,00,000 per transaction</p>
                  </div>

                  <div>
                    <label className="label">Note (optional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="input"
                      placeholder="What's this for?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={paying || !resolvedName}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Send {payAmount ? formatINR(parseFloat(payAmount) || 0) : ''}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="card p-0 overflow-hidden">
                  {upiTxns.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No UPI transactions yet</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {upiTxns.map((txn) => {
                        const isPaid = vpas.some((v) => v.vpa === txn.sender_vpa)
                        return (
                          <div key={txn.id} className="flex items-center gap-3 px-4 py-4">
                            <div className={clsx(
                              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                              isPaid ? 'bg-red-100' : 'bg-emerald-100'
                            )}>
                              <Send size={15} className={isPaid ? 'text-red-500 rotate-45' : 'text-emerald-500 -rotate-45'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {isPaid ? `To ${txn.receiver_vpa}` : `From ${txn.sender_vpa}`}
                              </div>
                              <div className="text-xs text-gray-400">{formatDateTime(txn.created_at)}</div>
                              {txn.note && <div className="text-xs text-gray-400 italic mt-0.5">{txn.note}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className={clsx('text-sm font-semibold', isPaid ? 'text-red-500' : 'text-emerald-600')}>
                                {isPaid ? '-' : '+'}{formatINR(txn.amount)}
                              </div>
                              <span className={clsx(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                txn.status === 'success' || txn.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : txn.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              )}>
                                {txn.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <TxnConfirmModal
        open={showConfirm}
        title="Confirm UPI Payment"
        rows={[
          { label: 'From VPA', value: senderVpa },
          { label: 'To VPA', value: receiverVpa },
          { label: 'Receiver', value: resolvedName },
          { label: 'Note', value: note || '—' },
          { label: 'Amount', value: `₹${(parseFloat(payAmount) || 0).toLocaleString('en-IN')}`, highlight: true },
        ]}
        onConfirm={() => { setShowConfirm(false); setShowOtp(true) }}
        onCancel={() => setShowConfirm(false)}
      />

      <OtpModal
        open={showOtp}
        mobile={user?.mobile ?? ''}
        onVerified={() => { setShowOtp(false); executePay() }}
        onCancel={() => setShowOtp(false)}
      />
    </BankingLayout>
  )
}
