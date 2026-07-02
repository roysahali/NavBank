import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, CheckCircle2, Plus, Trash2, Info, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import OtpModal from '../../components/ui/OtpModal'
import { accountsApi } from '../../api/accounts'
import { transactionsApi } from '../../api/transactions'
import { beneficiariesApi, type AddBeneficiaryPayload } from '../../api/beneficiaries'
import { formatINR } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import type { Account, Beneficiary } from '../../types'
import clsx from 'clsx'

type Mode = 'NEFT' | 'RTGS' | 'IMPS'
type Step = 'form' | 'confirm' | 'success'

const MODE_INFO: Record<Mode, { desc: string; limit: string; time: string; color: string }> = {
  NEFT: {
    desc: 'National Electronic Funds Transfer — batch processing, available all days',
    limit: 'No maximum limit (min ₹1)',
    time: '30 min – 2 hours',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  RTGS: {
    desc: 'Real Time Gross Settlement — real-time large value transfers',
    limit: 'Minimum ₹2,00,000',
    time: 'Instant (real-time)',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  IMPS: {
    desc: 'Immediate Payment Service — 24×7 instant transfer',
    limit: 'Up to ₹5,00,000',
    time: 'Instant (24×7)',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
}

export default function Transfer() {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('NEFT')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState('')
  const [showOtp, setShowOtp] = useState(false)

  // Form state
  const [fromAccountId, setFromAccountId] = useState('')
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)
  const [addNew, setAddNew] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // New beneficiary form
  const [newBenef, setNewBenef] = useState<AddBeneficiaryPayload>({
    name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    alias: '',
  })

  useEffect(() => {
    Promise.all([
      accountsApi.getMyAccounts(),
      beneficiariesApi.getBeneficiaries(),
    ]).then(([accs, bens]) => {
      const active = accs.filter((a) => a.status === 'active')
      setAccounts(active)
      if (active.length > 0) setFromAccountId(String(active[0].id))
      setBeneficiaries(bens)
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const fromAccount = accounts.find((a) => a.id === Number(fromAccountId))
  const amountNum = parseFloat(amount) || 0

  function validateForm(): string | null {
    if (!fromAccountId) return 'Select a source account'
    if (!selectedBeneficiary && !addNew) return 'Select or add a beneficiary'
    if (addNew) {
      if (!newBenef.name || !newBenef.account_number || !newBenef.ifsc_code) return 'Fill all beneficiary details'
    }
    if (amountNum <= 0) return 'Enter a valid amount'
    if (mode === 'RTGS' && amountNum < 200000) return 'RTGS minimum amount is ₹2,00,000'
    if (mode === 'IMPS' && amountNum > 500000) return 'IMPS maximum amount is ₹5,00,000'
    if (fromAccount && amountNum > fromAccount.balance) return 'Insufficient balance'
    return null
  }

  function handleProceed(e: React.FormEvent) {
    e.preventDefault()
    const err = validateForm()
    if (err) { toast.error(err); return }
    setStep('confirm')
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      let toAccountNumber = selectedBeneficiary?.account_number ?? ''

      if (addNew) {
        const saved = await beneficiariesApi.addBeneficiary(newBenef)
        toAccountNumber = saved.account_number
        setBeneficiaries((prev) => [...prev, saved])
        setSelectedBeneficiary(saved)
      }

      const txn = await transactionsApi.transfer({
        from_account_id: Number(fromAccountId),
        to_account_number: toAccountNumber,
        amount: amountNum,
        description: description || `${mode} Transfer`,
        transfer_mode: mode,
      })

      setReference(txn.reference_number ?? `REF${txn.id}`)
      setStep('success')
      toast.success('Transfer successful!')

      // Refresh accounts
      accountsApi.getMyAccounts()
        .then((accs) => setAccounts(accs.filter((a) => a.status === 'active')))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed')
      setStep('form')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('form')
    setAmount('')
    setDescription('')
    setSelectedBeneficiary(null)
    setAddNew(false)
    setNewBenef({ name: '', account_number: '', ifsc_code: '', bank_name: '', alias: '' })
    setReference('')
  }

  async function deleteBeneficiary(id: number) {
    try {
      await beneficiariesApi.deleteBeneficiary(id)
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id))
      if (selectedBeneficiary?.id === id) setSelectedBeneficiary(null)
      toast.success('Beneficiary removed')
    } catch {
      toast.error('Failed to remove beneficiary')
    }
  }

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-novbank-800 flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-novbank-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Fund Transfer</h1>
              <p className="text-gray-500 text-sm">Secure bank-to-bank transfers</p>
            </div>
          </div>
        </ScrollReveal>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                {(['NEFT', 'RTGS', 'IMPS'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={clsx(
                      'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                      mode === m
                        ? 'bg-white text-novbank-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Mode info */}
              <div className={clsx('rounded-xl border p-3.5 mb-4 text-xs flex gap-2', MODE_INFO[mode].color)}>
                <Info size={14} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-0.5">{MODE_INFO[mode].desc}</div>
                  <div className="flex gap-4 mt-1 opacity-80">
                    <span>Limit: {MODE_INFO[mode].limit}</span>
                    <span>•</span>
                    <span>Settlement: {MODE_INFO[mode].time}</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="card flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-novbank-600/30 border-t-novbank-600 rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleProceed} className="space-y-4">
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Source Account</h3>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          ••••{a.account_number.slice(-4)} ({a.account_type}) — {formatINR(a.balance)}
                        </option>
                      ))}
                    </select>
                    {fromAccount && (
                      <div className="mt-2 text-xs text-gray-400 flex justify-between">
                        <span>Available balance</span>
                        <span className="font-medium text-gray-600">{formatINR(fromAccount.balance)}</span>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Beneficiary</h3>
                      <button
                        type="button"
                        onClick={() => { setAddNew(!addNew); setSelectedBeneficiary(null) }}
                        className="text-xs text-novbank-600 font-medium hover:text-novbank-700 flex items-center gap-1"
                      >
                        <Plus size={12} /> {addNew ? 'Choose saved' : 'Add new'}
                      </button>
                    </div>

                    {!addNew ? (
                      <div className="space-y-2">
                        {beneficiaries.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">No saved beneficiaries. Add one below.</p>
                        ) : (
                          beneficiaries.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBeneficiary(b)}
                              className={clsx(
                                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                                selectedBeneficiary?.id === b.id
                                  ? 'border-novbank-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              )}
                            >
                              <div className="w-9 h-9 rounded-full bg-novbank-100 flex items-center justify-center text-novbank-700 font-bold text-sm shrink-0">
                                {b.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">{b.alias ?? b.name}</div>
                                <div className="text-xs text-gray-400">{b.bank_name} · ••••{b.account_number.slice(-4)}</div>
                              </div>
                              {selectedBeneficiary?.id === b.id && (
                                <CheckCircle2 size={16} className="text-novbank-600 shrink-0" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deleteBeneficiary(b.id) }}
                                className="p-1 text-gray-300 hover:text-red-400 shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newBenef.name}
                          onChange={(e) => setNewBenef((p) => ({ ...p, name: e.target.value }))}
                          className="input"
                          placeholder="Beneficiary full name"
                          required
                        />
                        <input
                          type="text"
                          value={newBenef.account_number}
                          onChange={(e) => setNewBenef((p) => ({ ...p, account_number: e.target.value }))}
                          className="input font-mono"
                          placeholder="Account number"
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newBenef.ifsc_code}
                            onChange={(e) => setNewBenef((p) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))}
                            className="input font-mono"
                            placeholder="IFSC Code"
                            required
                          />
                          <input
                            type="text"
                            value={newBenef.bank_name}
                            onChange={(e) => setNewBenef((p) => ({ ...p, bank_name: e.target.value }))}
                            className="input"
                            placeholder="Bank name"
                          />
                        </div>
                        <input
                          type="text"
                          value={newBenef.alias ?? ''}
                          onChange={(e) => setNewBenef((p) => ({ ...p, alias: e.target.value }))}
                          className="input"
                          placeholder="Nickname (optional)"
                        />
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Amount & Details</h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                        <input
                          type="number"
                          min={mode === 'RTGS' ? '200000' : '1'}
                          max={mode === 'IMPS' ? '500000' : undefined}
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="input pl-8 text-lg font-semibold"
                          placeholder="0"
                          required
                        />
                      </div>
                      {amountNum > 0 && fromAccount && (
                        <div className="text-xs text-gray-400 flex justify-between">
                          <span>Remaining balance after transfer</span>
                          <span className={clsx(
                            'font-medium',
                            fromAccount.balance - amountNum < 0 ? 'text-red-500' : 'text-gray-600'
                          )}>
                            {formatINR(fromAccount.balance - amountNum)}
                          </span>
                        </div>
                      )}
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input"
                        placeholder="Purpose / description (optional)"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                    <Send size={16} />
                    Review Transfer
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="card"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">Confirm Transfer</h2>
              <div className="space-y-3">
                {[
                  { label: 'Transfer Mode', value: mode },
                  { label: 'From Account', value: fromAccount ? `••••${fromAccount.account_number.slice(-4)} (${fromAccount.account_type})` : '' },
                  { label: 'To', value: addNew ? newBenef.name : (selectedBeneficiary?.alias ?? selectedBeneficiary?.name ?? '') },
                  { label: 'Account No.', value: addNew ? newBenef.account_number : (selectedBeneficiary?.account_number ?? '') },
                  { label: 'IFSC', value: addNew ? newBenef.ifsc_code : (selectedBeneficiary?.ifsc_code ?? '') },
                  { label: 'Amount', value: formatINR(amountNum), highlight: true },
                  { label: 'Description', value: description || '—' },
                  { label: 'Settlement', value: MODE_INFO[mode].time },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={clsx('text-sm font-medium', highlight ? 'text-novbank-600 text-base font-bold' : 'text-gray-900')}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('form')}
                  disabled={submitting}
                  className="btn-secondary flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowOtp(true)}
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Confirm &amp; Transfer
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 size={40} className="text-emerald-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Transfer Successful!</h2>
              <p className="text-gray-500 text-sm mb-4">
                {formatINR(amountNum)} sent via {mode}
              </p>
              <div className="bg-gray-50 rounded-xl px-6 py-4 mb-6 text-left">
                <div className="text-xs text-gray-400 mb-1">Reference Number</div>
                <div className="font-mono font-bold text-gray-800 text-sm">{reference}</div>
              </div>
              <button onClick={reset} className="btn-primary w-full">
                Make Another Transfer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <OtpModal
        open={showOtp}
        mobile={user?.mobile ?? ''}
        onVerified={() => { setShowOtp(false); handleConfirm() }}
        onCancel={() => setShowOtp(false)}
      />
    </BankingLayout>
  )
}
