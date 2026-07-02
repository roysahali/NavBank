import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard as CreditCardIcon, Gift, Calendar, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import TxnConfirmModal from '../../components/ui/TxnConfirmModal'
import OtpModal from '../../components/ui/OtpModal'
import CreditCardDisplay from '../../components/cards/CreditCardDisplay'
import { creditCardsApi } from '../../api/creditCards'
import { accountsApi } from '../../api/accounts'
import { formatINR, formatDate, getCategoryIcon } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'
import type { CreditCard, CreditCardTransaction, Account } from '../../types'
import clsx from 'clsx'

function CardDetailPanel({ card, onCardUpdate }: { card: CreditCard; onCardUpdate: (updated: CreditCard) => void }) {
  const { user } = useAuth()
  const [cardTab, setCardTab] = useState<'overview' | 'transactions' | 'pay'>('overview')
  const [txns, setTxns] = useState<CreditCardTransaction[]>([])
  const [loadingTxns, setLoadingTxns] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [payAccountId, setPayAccountId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showOtp, setShowOtp] = useState(false)

  useEffect(() => {
    if (cardTab === 'transactions' && txns.length === 0) {
      setLoadingTxns(true)
      creditCardsApi.getCardTransactions(card.id)
        .then(setTxns)
        .catch(() => toast.error('Failed to load card transactions'))
        .finally(() => setLoadingTxns(false))
    }
    if (cardTab === 'pay' && accounts.length === 0) {
      accountsApi.getMyAccounts()
        .then((accs) => {
          const active = accs.filter((a) => a.status === 'active')
          setAccounts(active)
          if (active.length > 0) setPayAccountId(String(active[0].id))
        })
        .catch(() => {})
    }
  }, [cardTab, card.id])

  function handlePayBill(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (!payAccountId) { toast.error('Select a source account'); return }
    setShowConfirm(true)
  }

  async function executePayBill() {
    const amt = parseFloat(payAmount)
    setPaying(true)
    try {
      const updated = await creditCardsApi.payBill({ card_id: card.id, from_account_id: Number(payAccountId), amount: amt })
      toast.success(`Bill payment of ${formatINR(amt)} successful!`)
      setPayAmount('')
      onCardUpdate(updated)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const utilizationPct = Math.min(100, (card.outstanding_amount / card.credit_limit) * 100)
  const utilizationColor = utilizationPct > 80 ? 'bg-red-500' : utilizationPct > 50 ? 'bg-amber-400' : 'bg-emerald-500'

  const expiry = `${String(card.expiry_month).padStart(2, '0')}/${card.expiry_year}`

  return (
    <div>
      {/* Card + summary */}
      <div className="flex flex-col lg:flex-row gap-8 items-start mb-6">
        <div className="shrink-0">
          <CreditCardDisplay card={card} />
        </div>

        <div className="flex-1 space-y-4 mt-8 lg:mt-0">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Card Variant</div>
            <div className="text-lg font-bold text-gray-900 capitalize">{card.card_variant} {card.card_type}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                'px-2.5 py-0.5 rounded-full text-xs font-medium',
                card.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
              )}>
                {card.status}
              </span>
              <span className="text-xs text-gray-400">Expires {expiry}</span>
            </div>
          </div>

          {/* Utilization bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Credit Utilization</span>
              <span className="font-medium">{utilizationPct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${utilizationPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={clsx('h-full rounded-full', utilizationColor)}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-gray-400">Used: <span className="text-gray-700 font-medium">{formatINR(card.outstanding_amount)}</span></span>
              <span className="text-gray-400">Total: <span className="text-gray-700 font-medium">{formatINR(card.credit_limit)}</span></span>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">Available Limit</div>
              <div className="text-sm font-bold text-gray-900">{formatINR(card.available_limit)}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                <AlertCircle size={10} /> Min Due
              </div>
              <div className="text-sm font-bold text-amber-700">{formatINR(card.minimum_due)}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                <Calendar size={10} /> Bill Date
              </div>
              <div className="text-sm font-bold text-blue-700">{card.billing_date}th of month</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <div className="text-xs text-purple-600 mb-1 flex items-center gap-1">
                <Gift size={10} /> Reward Points
              </div>
              <div className="text-sm font-bold text-purple-700">{card.reward_points.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {(['overview', 'transactions', 'pay'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setCardTab(t)}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              cardTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'pay' ? 'Pay Bill' : t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {cardTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {[
                { label: 'Credit Limit', value: formatINR(card.credit_limit) },
                { label: 'Outstanding Amount', value: formatINR(card.outstanding_amount), highlight: 'text-red-600' },
                { label: 'Available Limit', value: formatINR(card.available_limit), highlight: 'text-emerald-600' },
                { label: 'Minimum Due', value: formatINR(card.minimum_due), highlight: 'text-amber-600' },
                { label: 'Payment Due Day', value: `${card.due_date_day}th of each month` },
                { label: 'Billing Date', value: `${card.billing_date}th of each month` },
                { label: 'Reward Points', value: card.reward_points.toLocaleString('en-IN') + ' pts' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={clsx('text-sm font-semibold', highlight ?? 'text-gray-900')}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {cardTab === 'transactions' && (
          <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loadingTxns ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-novbank-600/30 border-t-novbank-600 rounded-full animate-spin" />
              </div>
            ) : txns.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No transactions found</div>
            ) : (
              <div className="space-y-1">
                {txns.map((txn) => (
                  <div key={txn.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
                      {getCategoryIcon(txn.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{txn.merchant_name}</div>
                      <div className="text-xs text-gray-400 capitalize">{txn.category} · {formatDate(txn.created_at)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={clsx(
                        'text-sm font-semibold',
                        txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-gray-900'
                      )}>
                        {txn.transaction_type === 'credit' ? '+' : '-'}{formatINR(txn.amount)}
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize">{txn.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {cardTab === 'pay' && (
          <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <form onSubmit={handlePayBill} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">Payment Summary</div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Total Outstanding</span>
                  <span className="font-bold text-blue-900">{formatINR(card.outstanding_amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-blue-700">Minimum Due</span>
                  <span className="font-medium text-blue-900">{formatINR(card.minimum_due)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-blue-700">Due Date</span>
                  <span className="font-medium text-blue-900">{card.due_date_day}th of this month</span>
                </div>
              </div>

              <div>
                <label className="label">Pay From Account</label>
                <select value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} className="input" required>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      ••••{a.account_number.slice(-4)} — {formatINR(a.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    min={card.minimum_due}
                    max={card.outstanding_amount}
                    step="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="input pl-8 text-lg font-semibold"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(card.minimum_due))}
                    className="text-xs text-novbank-600 border border-novbank-200 rounded-lg px-3 py-1.5 hover:bg-novbank-50"
                  >
                    Min Due
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(card.outstanding_amount))}
                    className="text-xs text-novbank-600 border border-novbank-200 rounded-lg px-3 py-1.5 hover:bg-novbank-50"
                  >
                    Full Amount
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={paying}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {paying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Pay Bill
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <TxnConfirmModal
        open={showConfirm}
        title="Confirm Bill Payment"
        rows={[
          { label: 'Card', value: `${card.card_variant} ••••${card.card_number.slice(-4)}` },
          { label: 'Outstanding', value: formatINR(card.outstanding_amount) },
          { label: 'Paying', value: formatINR(parseFloat(payAmount) || 0), highlight: true },
        ]}
        onConfirm={() => { setShowConfirm(false); setShowOtp(true) }}
        onCancel={() => setShowConfirm(false)}
      />

      <OtpModal
        open={showOtp}
        mobile={user?.mobile ?? ''}
        onVerified={() => { setShowOtp(false); executePayBill() }}
        onCancel={() => setShowOtp(false)}
      />
    </div>
  )
}

export default function CreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    creditCardsApi.getCards()
      .then(setCards)
      .catch(() => toast.error('Failed to load credit cards'))
      .finally(() => setLoading(false))
  }, [])

  function openCard(card: CreditCard) {
    setSelectedCard(card)
    setModalOpen(true)
  }

  return (
    <BankingLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <CreditCardIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Credit Cards</h1>
              <p className="text-gray-500 text-sm">{cards.length} card{cards.length !== 1 ? 's' : ''} linked</p>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : cards.length === 0 ? (
          <div className="card text-center py-16">
            <CreditCardIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No credit cards found</p>
            <p className="text-gray-400 text-sm mt-1">Contact your branch to apply for a credit card</p>
          </div>
        ) : (
          <div className="space-y-8">
            {cards.map((card) => {
              const utilizationPct = Math.min(100, (card.outstanding_amount / card.credit_limit) * 100)
              const utilizationColor = utilizationPct > 80 ? 'bg-red-500' : utilizationPct > 50 ? 'bg-amber-400' : 'bg-emerald-500'
              return (
                <ScrollReveal key={card.id}>
                  <div className="card overflow-visible">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* 3D Card */}
                      <div className="shrink-0 flex items-start pt-2">
                        <CreditCardDisplay card={card} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 mt-8 lg:mt-0">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-lg font-bold text-gray-900 capitalize">
                              {card.card_variant} {card.card_type}
                            </div>
                            <div className="text-sm text-gray-400 mt-0.5">
                              ••••{card.card_number.slice(-4)} · Expires {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                            </div>
                          </div>
                          <span className={clsx(
                            'px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0',
                            card.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {card.status}
                          </span>
                        </div>

                        {/* Utilization */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Credit Utilization — {utilizationPct.toFixed(0)}%</span>
                            <span>{formatINR(card.outstanding_amount)} / {formatINR(card.credit_limit)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${utilizationPct}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={clsx('h-full rounded-full', utilizationColor)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                          <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-gray-400 mb-1">Available</div>
                            <div className="text-sm font-bold text-gray-900">{formatINR(card.available_limit)}</div>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-amber-600 mb-1">Min Due</div>
                            <div className="text-sm font-bold text-amber-700">{formatINR(card.minimum_due)}</div>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-blue-600 mb-1">Due Date</div>
                            <div className="text-sm font-bold text-blue-700">{card.due_date_day}th</div>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-3 text-center">
                            <div className="text-xs text-purple-600 mb-1 flex items-center justify-center gap-0.5">
                              <Gift size={9} /> Points
                            </div>
                            <div className="text-sm font-bold text-purple-700">{card.reward_points.toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => openCard(card)}
                          className="flex items-center gap-2 text-sm font-medium text-novbank-600 hover:text-novbank-700 transition-colors"
                        >
                          View Details & Pay Bill
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCard(null) }}
        title={selectedCard ? `${selectedCard.card_variant} ${selectedCard.card_type}` : ''}
        size="lg"
      >
        {selectedCard && (
          <div className="p-6">
            <CardDetailPanel
              card={selectedCard}
              onCardUpdate={(updated) => {
                setSelectedCard(updated)
                setCards((prev) => prev.map((c) => c.id === updated.id ? updated : c))
              }}
            />
          </div>
        )}
      </Modal>
    </BankingLayout>
  )
}
