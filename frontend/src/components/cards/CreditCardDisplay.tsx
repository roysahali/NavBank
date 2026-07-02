import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import type { CreditCard } from '../../types'
import { maskCardNumber } from '../../utils/formatters'
import clsx from 'clsx'

interface CreditCardDisplayProps {
  card: CreditCard
  className?: string
}

function getCardGradient(cardType: string, variant: string): string {
  const type = cardType?.toLowerCase()
  const v = variant?.toLowerCase()

  if (type === 'rupay') {
    return 'from-[#0A1628] via-[#1B3A6B] to-[#C8972A]'
  }
  if (type === 'mastercard') {
    if (v?.includes('platinum')) return 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
    return 'from-[#0D1B2A] via-[#1B2F4A] to-[#2C4A6E]'
  }
  // Visa
  if (v?.includes('signature') || v?.includes('platinum')) {
    return 'from-[#020B18] via-[#0D2147] to-[#163669]'
  }
  return 'from-[#0A1628] via-[#163669] to-[#1B4DA8]'
}

function CardNetworkLogo({ cardType }: { cardType: string }) {
  const type = cardType?.toLowerCase()
  if (type === 'visa') {
    return (
      <span className="font-bold text-2xl italic tracking-wider text-white/90">VISA</span>
    )
  }
  if (type === 'mastercard') {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-red-500/90 -mr-3" />
        <div className="w-8 h-8 rounded-full bg-amber-400/90" />
      </div>
    )
  }
  if (type === 'rupay') {
    return (
      <span className="font-bold text-xl tracking-wider text-white/90">RuPay</span>
    )
  }
  return <span className="text-white/80 font-semibold text-sm uppercase">{cardType}</span>
}

export default function CreditCardDisplay({ card, className }: CreditCardDisplayProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const gradient = getCardGradient(card.card_type, card.card_variant)
  const expiry = `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`

  function copyValue(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const displayCardNumber = revealed ? card.card_number : maskCardNumber(card.card_number)
  const displayCvv = revealed ? card.cvv : '•••'

  const details = [
    { label: 'Card Number', value: card.card_number, key: 'cardno' },
    { label: 'Expiry', value: expiry, key: 'expiry' },
    { label: 'CVV', value: card.cvv, key: 'cvv' },
  ]

  return (
    <div className={clsx('relative', className)} style={{ width: '320px' }}>
      {/* Card */}
      <div
        style={{ perspective: '1000px', width: '320px', height: '200px' }}
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer"
        title="Click to flip"
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-full"
        >
          {/* FRONT */}
          <div
            className={clsx(
              'absolute inset-0 rounded-2xl bg-gradient-to-br overflow-hidden shadow-2xl',
              gradient
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-novbank-gold/20 to-transparent rounded-bl-[100%]" />

            <div className="relative p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm tracking-widest">NovBank</div>
                  <div className="text-white/50 text-xs mt-0.5 uppercase tracking-wider">
                    {card.card_variant || 'Classic'}
                  </div>
                </div>
                <CardNetworkLogo cardType={card.card_type} />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300/80 to-amber-400/80 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5 w-6">
                    <div className="h-1.5 bg-amber-600/40 rounded-sm" />
                    <div className="h-1.5 bg-amber-600/40 rounded-sm" />
                    <div className="h-1.5 bg-amber-600/40 rounded-sm" />
                    <div className="h-1.5 bg-amber-600/40 rounded-sm" />
                  </div>
                </div>
                <div className="h-0.5 w-6 bg-white/30" />
                <div className="text-white/40 text-xs">CONTACTLESS</div>
              </div>

              <div className="mt-3">
                <div className="text-white font-mono text-lg tracking-[0.2em] font-medium transition-all duration-300">
                  {displayCardNumber}
                </div>
              </div>

              <div className="flex items-end justify-between mt-2">
                <div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</div>
                  <div className="text-white text-sm font-medium tracking-wide">NOVBANK USER</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Expires</div>
                  <div className="text-white text-sm font-medium tracking-wider">{expiry}</div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div
            className={clsx(
              'absolute inset-0 rounded-2xl bg-gradient-to-br overflow-hidden shadow-2xl',
              gradient
            )}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="w-full h-12 bg-gray-900 mt-8" />

            <div className="px-6 mt-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 bg-white/90 rounded flex items-center px-3">
                  <div className="flex-1 border-b-2 border-gray-300 border-dashed" />
                </div>
                <div className="bg-white/20 rounded px-3 py-2 text-center min-w-[56px]">
                  <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">CVV</div>
                  <div className="text-white font-mono font-bold text-base tracking-widest transition-all duration-300">
                    {displayCvv}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 mt-6">
              <div className="text-white/40 text-[10px] leading-relaxed">
                This card is property of NovBank. If found, please return to the nearest NovBank branch or call 1800-XXX-XXXX.
              </div>
            </div>

            <div className="absolute bottom-4 right-6">
              <CardNetworkLogo cardType={card.card_type} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-5 px-1">
        <div className="text-xs text-gray-400">Click card to flip</div>
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          {revealed ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Revealed details strip */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100"
          >
            {details.map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-sm font-mono font-semibold text-gray-800">{value}</div>
                </div>
                <button
                  onClick={() => copyValue(value, key)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  title={`Copy ${label}`}
                >
                  {copied === key
                    ? <Check size={13} className="text-emerald-600" />
                    : <Copy size={13} className="text-gray-400" />
                  }
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
