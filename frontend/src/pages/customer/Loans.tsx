import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Home, Car, User, Calendar, TrendingDown, CheckCircle2, ChevronRight,
  X, Percent, IndianRupee, Clock, ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import OtpModal from '../../components/ui/OtpModal'
import { loansApi } from '../../api/loans'
import { accountsApi } from '../../api/accounts'
import { loanApplicationsApi, type LoanApplicationOut } from '../../api/loanApplications'
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import type { Loan, EmiScheduleItem, Account } from '../../types'
import clsx from 'clsx'

const LOAN_PRODUCTS = [
  {
    type: 'personal',
    name: 'Personal Loan',
    icon: <User size={20} />,
    gradient: 'from-purple-600 to-violet-500',
    rate: '10.5% p.a.',
    maxAmount: '₹25 Lakh',
    tenure: 'Up to 60 months',
    features: ['Instant disbursal', 'No collateral', 'Minimal documentation'],
  },
  {
    type: 'home',
    name: 'Home Loan',
    icon: <Home size={20} />,
    gradient: 'from-emerald-600 to-teal-500',
    rate: '7.5% p.a.',
    maxAmount: '₹5 Crore',
    tenure: 'Up to 30 years',
    features: ['Low EMI', 'Tax benefits u/s 80C', 'Top-up loan available'],
  },
  {
    type: 'auto',
    name: 'Auto Loan',
    icon: <Car size={20} />,
    gradient: 'from-blue-600 to-cyan-500',
    rate: '8.9% p.a.',
    maxAmount: '₹1 Crore',
    tenure: 'Up to 84 months',
    features: ['New & used vehicles', '90% on-road funding', '24hr approval'],
  },
]

interface LoanApplyForm {
  loan_type: string
  amount: string
  tenure: string
  purpose: string
  monthly_income: string
}

function LoanApplyModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selected, setSelected] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<LoanApplyForm>({
    loan_type: '', amount: '', tenure: '', purpose: '', monthly_income: '',
  })
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    accountsApi.getMyAccounts()
      .then(accs => {
        const active = accs.filter(a => a.status === 'active')
        setAccounts(active)
        if (active.length > 0) setAccountId(String(active[0].id))
      })
      .catch(() => {})
  }, [])

  function setF(k: keyof LoanApplyForm, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setF('loan_type', selected); setStep(2); return }
    if (step === 2) { setStep(3); return }
    setLoading(true)
    try {
      await loanApplicationsApi.apply({
        loan_type: selected,
        amount: parseFloat(form.amount),
        tenure_months: parseInt(form.tenure),
        purpose: form.purpose,
        monthly_income: parseFloat(form.monthly_income),
        account_id: parseInt(accountId),
      })
      toast.success('Application submitted! Admin will review within 2 business days.')
      onSubmitted()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const emiEst = () => {
    const p = parseFloat(form.amount) || 0
    const r = selected === 'home' ? 7.5 : selected === 'auto' ? 8.9 : 10.5
    const n = parseInt(form.tenure) || 12
    const monthly = r / 12 / 100
    if (!p || !n) return '—'
    const emi = (p * monthly * Math.pow(1 + monthly, n)) / (Math.pow(1 + monthly, n) - 1)
    return formatINR(Math.round(emi))
  }

  return (
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
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-novbank-950 to-novbank-800 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-novbank-gold/20 border border-novbank-gold/30 flex items-center justify-center">
              <Building2 size={16} className="text-novbank-gold" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Apply for a Loan</p>
              <p className="text-white/50 text-xs">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex bg-novbank-950 px-5 pb-3 gap-1.5 shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className={clsx('h-0.5 flex-1 rounded-full transition-all', step >= s ? 'bg-novbank-gold' : 'bg-white/15')} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-5 py-5 space-y-4">
            {step === 1 && (
              <>
                <p className="text-sm font-medium text-gray-700">Select the type of loan you need</p>
                <div className="space-y-3">
                  {LOAN_PRODUCTS.map(p => (
                    <label key={p.type} className={clsx(
                      'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selected === p.type ? 'border-novbank-600 bg-novbank-50' : 'border-gray-100 hover:border-gray-200'
                    )}>
                      <input type="radio" className="sr-only" checked={selected === p.type} onChange={() => setSelected(p.type)} />
                      <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', p.gradient)}>
                        {p.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.rate} · {p.maxAmount} · {p.tenure}</div>
                      </div>
                      <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        selected === p.type ? 'border-novbank-600' : 'border-gray-300'
                      )}>
                        {selected === p.type && <div className="w-2 h-2 rounded-full bg-novbank-600" />}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-medium text-gray-700">Loan details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Loan Amount (₹)</label>
                    <input required type="number" min="10000" value={form.amount} onChange={e => setF('amount', e.target.value)}
                      className="input text-sm" placeholder="e.g. 500000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tenure (months)</label>
                    <select required value={form.tenure} onChange={e => setF('tenure', e.target.value)} className="input text-sm">
                      <option value="">Select</option>
                      {[12, 24, 36, 48, 60, 84, 120, 180, 240].map(m => (
                        <option key={m} value={m}>{m} months ({(m / 12).toFixed(0)} yr{m >= 24 ? 's' : ''})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
                  <input required value={form.purpose} onChange={e => setF('purpose', e.target.value)}
                    className="input text-sm" placeholder="e.g. Home renovation, travel, medical" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Income (₹)</label>
                  <input required type="number" value={form.monthly_income} onChange={e => setF('monthly_income', e.target.value)}
                    className="input text-sm" placeholder="Net monthly take-home" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Disbursal Account</label>
                  <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="input text-sm">
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        ••••{a.account_number.slice(-4)} — {a.account_type} — {formatINR(a.balance)}
                      </option>
                    ))}
                  </select>
                </div>
                {form.amount && form.tenure && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                    <IndianRupee size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-gray-500">Estimated EMI: </span>
                      <span className="font-bold text-emerald-700">{emiEst()}/month</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm font-medium text-gray-700">Review your application</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {[
                    ['Loan Type', LOAN_PRODUCTS.find(p => p.type === selected)?.name ?? selected],
                    ['Amount', form.amount ? formatINR(parseFloat(form.amount)) : '—'],
                    ['Tenure', form.tenure ? `${form.tenure} months` : '—'],
                    ['Purpose', form.purpose],
                    ['Monthly Income', form.monthly_income ? formatINR(parseFloat(form.monthly_income)) : '—'],
                    ['Est. EMI', emiEst()],
                    ['Disbursal A/C', accounts.find(a => String(a.id) === accountId)
                      ? `••••${accounts.find(a => String(a.id) === accountId)!.account_number.slice(-4)}`
                      : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium text-gray-900">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <ShieldCheck size={13} className="shrink-0 mt-0.5" />
                  Subject to credit assessment. A loan advisor will call you within 2 business days.
                </div>
              </>
            )}
          </div>

          <div className="px-5 pb-5 flex gap-3 shrink-0">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="btn-secondary flex-1">
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={step === 1 && !selected || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : step < 3 ? 'Continue' : 'Submit Application'
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

const LOAN_ICONS: Record<string, React.ReactNode> = {
  home: <Home size={22} />,
  auto: <Car size={22} />,
  personal: <User size={22} />,
}

const LOAN_COLORS: Record<string, string> = {
  home: 'from-emerald-600 to-teal-500',
  auto: 'from-blue-600 to-cyan-500',
  personal: 'from-purple-600 to-violet-500',
}

function EmiModal({
  loan,
  isOpen,
  onClose,
  onLoanUpdate,
}: {
  loan: Loan
  isOpen: boolean
  onClose: () => void
  onLoanUpdate: (outstanding: number, status: string) => void
}) {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<EmiScheduleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [payAccountId, setPayAccountId] = useState('')
  const [paying, setPaying] = useState(false)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  const [showOtp, setShowOtp] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([
        loansApi.getEmiSchedule(loan.id),
        accountsApi.getMyAccounts(),
      ]).then(([sched, accs]) => {
        setSchedule(sched)
        const active = accs.filter((a) => a.status === 'active')
        setAccounts(active)
        if (active.length > 0) setPayAccountId(String(active[0].id))
      }).catch(() => toast.error('Failed to load EMI schedule'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, loan.id])

  async function handlePayEmi() {
    setPaying(true)
    try {
      const res = await loansApi.payEmi({ loan_id: loan.id, from_account_id: Number(payAccountId) })
      toast.success(`EMI of ${formatINR(loan.emi_amount)} paid successfully!`)
      onLoanUpdate(res.outstanding_amount, res.loan_status)
      setShowPayConfirm(false)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'EMI payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="EMI Schedule" size="lg">
      <div className="p-6">
        {/* Loan summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-wrap gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Loan Number</div>
            <div className="font-mono font-medium">{loan.loan_number}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">EMI Amount</div>
            <div className="font-bold text-novbank-700">{formatINR(loan.emi_amount)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Next Due</div>
            <div className="font-medium text-amber-700">{formatDate(loan.next_due_date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Interest Rate</div>
            <div className="font-medium">{loan.interest_rate}% p.a.</div>
          </div>
        </div>

        {/* Pay EMI button */}
        {!showPayConfirm ? (
          <button
            onClick={() => setShowPayConfirm(true)}
            className="btn-gold w-full mb-4 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Pay EMI Now — {formatINR(loan.emi_amount)}
          </button>
        ) : (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-amber-900 mb-3">
              Confirm EMI payment of <strong>{formatINR(loan.emi_amount)}</strong>
            </p>
            <select
              value={payAccountId}
              onChange={(e) => setPayAccountId(e.target.value)}
              className="input mb-3 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  ••••{a.account_number.slice(-4)} — {formatINR(a.balance)}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayConfirm(false)}
                className="btn-secondary flex-1 text-sm py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOtp(true)}
                disabled={paying}
                className="btn-primary flex-1 text-sm py-2.5 flex items-center justify-center gap-2"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* Schedule table */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-novbank-600/30 border-t-novbank-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Due Date', 'EMI', 'Principal', 'Interest', 'Outstanding', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schedule.map((item) => (
                  <tr key={item.installment_number} className={clsx(
                    item.status === 'paid' ? 'bg-emerald-50/30' : 'hover:bg-gray-50'
                  )}>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{item.installment_number}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{formatDate(item.due_date)}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 text-xs">{formatINR(item.emi_amount)}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{formatINR(item.principal)}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{formatINR(item.interest)}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{formatINR(item.outstanding_after)}</td>
                    <td className="px-3 py-2.5">
                      <span className={clsx(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize',
                        item.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        item.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OtpModal
        open={showOtp}
        mobile={user?.mobile ?? ''}
        onVerified={() => { setShowOtp(false); handlePayEmi() }}
        onCancel={() => setShowOtp(false)}
      />
    </Modal>
  )
}

const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Under Review', color: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved',     color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Not Approved', color: 'bg-red-100 text-red-700' },
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [applications, setApplications] = useState<LoanApplicationOut[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [emiModalOpen, setEmiModalOpen] = useState(false)
  const [showApply, setShowApply] = useState(false)

  function loadAll() {
    setLoading(true)
    Promise.all([
      loansApi.getLoans(),
      loanApplicationsApi.myApplications(),
    ]).then(([lns, apps]) => {
      setLoans(lns)
      setApplications(apps)
    }).catch(() => toast.error('Failed to load loans'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Loans</h1>
                <p className="text-gray-500 text-sm">{loans.filter((l) => l.status === 'active').length} active loan{loans.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={() => setShowApply(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Building2 size={15} /> Apply for Loan
            </button>
          </div>
        </ScrollReveal>

        {/* Loan products advertisement */}
        <ScrollReveal delay={0.04}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {LOAN_PRODUCTS.map((p) => (
              <motion.div
                key={p.type}
                whileHover={{ y: -2 }}
                className={clsx('rounded-2xl bg-gradient-to-br p-4 text-white relative overflow-hidden cursor-pointer')}
                style={{ background: undefined }}
                onClick={() => setShowApply(true)}
              >
                <div className={clsx('absolute inset-0 bg-gradient-to-br rounded-2xl', p.gradient)} />
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    {p.icon}
                  </div>
                  <div className="font-bold text-sm mb-1">{p.name}</div>
                  <div className="flex items-center gap-1 text-white/70 text-xs mb-3">
                    <Percent size={10} /> {p.rate}
                  </div>
                  <div className="space-y-1 mb-3">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-[11px] text-white/80">
                        <CheckCircle2 size={10} className="text-white/60" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/50">Up to</div>
                      <div className="font-bold text-sm">{p.maxAmount}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-white/70">
                      <Clock size={10} /> {p.tenure}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : loans.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active loans</p>
            <p className="text-gray-400 text-sm mt-1">Contact your branch to apply for a loan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {loans.map((loan) => {
              const paidAmt = loan.principal_amount - loan.outstanding_amount
              const paidPct = Math.min(100, (paidAmt / loan.principal_amount) * 100)
              const gradient = LOAN_COLORS[loan.loan_type] ?? 'from-gray-600 to-gray-500'

              return (
                <ScrollReveal key={loan.id}>
                  <div className="card p-0 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className={clsx('bg-gradient-to-r p-5 text-white relative overflow-hidden', gradient)}>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                        {LOAN_ICONS[loan.loan_type] && (
                          <span className="scale-[3] block">{LOAN_ICONS[loan.loan_type]}</span>
                        )}
                      </div>
                      <div className="relative flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white/70 text-sm capitalize">{loan.loan_type} Loan</span>
                            <span className={clsx(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              loan.status === 'active' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                            )}>
                              {loan.status}
                            </span>
                          </div>
                          <div className="font-mono text-sm text-white/60 mb-2">{loan.loan_number}</div>
                          <div className="text-2xl font-bold">{formatINR(loan.outstanding_amount)}</div>
                          <div className="text-white/50 text-xs mt-0.5">Outstanding (of {formatINR(loan.principal_amount)})</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/50 text-xs mb-0.5">EMI Amount</div>
                          <div className="text-lg font-bold">{formatINR(loan.emi_amount)}</div>
                          <div className="text-white/50 text-xs mt-1">per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>Repayment Progress</span>
                        <span className="font-medium">{paidPct.toFixed(0)}% paid</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${paidPct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1.5 text-gray-400">
                        <span>Paid: {formatINR(paidAmt)}</span>
                        <span>Remaining: {formatINR(loan.outstanding_amount)}</span>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                      <div className="p-4 text-center">
                        <div className="text-xs text-gray-400 mb-1">Interest Rate</div>
                        <div className="text-sm font-bold text-gray-900">{loan.interest_rate}% p.a.</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-xs text-gray-400 mb-1">Tenure</div>
                        <div className="text-sm font-bold text-gray-900">{loan.tenure_months} months</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-xs text-amber-600 mb-1 flex items-center justify-center gap-1">
                          <Calendar size={10} /> Next Due
                        </div>
                        <div className="text-sm font-bold text-amber-700">{formatDate(loan.next_due_date)}</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-xs text-gray-400 mb-1">Disbursed</div>
                        <div className="text-sm font-bold text-gray-900">
                          {loan.disbursed_date ? formatDate(loan.disbursed_date) : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 border-t border-gray-100">
                      <button
                        onClick={() => { setSelectedLoan(loan); setEmiModalOpen(true) }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <TrendingDown size={14} />
                        EMI Schedule
                        <ChevronRight size={12} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => { setSelectedLoan(loan); setEmiModalOpen(true) }}
                        className="btn-primary py-2.5 flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 size={14} />
                        Pay EMI
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}

        {/* My Applications */}
        {applications.length > 0 && (
          <ScrollReveal delay={0.05}>
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={15} className="text-novbank-600" /> My Loan Applications
              </h2>
              <div className="card p-0 overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Type', 'Amount', 'Tenure', 'EMI Est.', 'Applied On', 'Status', 'Note'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {applications.map(app => {
                      const st = APP_STATUS[app.status] ?? APP_STATUS.pending
                      return (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{app.loan_type}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatINR(app.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{app.tenure_months} mo</td>
                          <td className="px-4 py-3 text-sm text-novbank-700 font-medium">
                            {app.emi_amount ? formatINR(app.emi_amount) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {formatDateTime(app.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', st.color)}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">
                            {app.admin_note ?? (app.status === 'pending' ? 'Awaiting review' : '—')}
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

      {selectedLoan && (
        <EmiModal
          loan={selectedLoan}
          isOpen={emiModalOpen}
          onClose={() => { setEmiModalOpen(false); setSelectedLoan(null) }}
          onLoanUpdate={(outstanding, status) => {
            setLoans((prev) =>
              prev.map((l) =>
                l.id === selectedLoan.id ? { ...l, outstanding_amount: outstanding, status } : l
              )
            )
          }}
        />
      )}

      <AnimatePresence>
        {showApply && (
          <LoanApplyModal
            onClose={() => setShowApply(false)}
            onSubmitted={() => loanApplicationsApi.myApplications().then(setApplications).catch(() => {})}
          />
        )}
      </AnimatePresence>
    </BankingLayout>
  )
}
