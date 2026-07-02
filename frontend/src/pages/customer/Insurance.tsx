import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Car, Plane, Home, Shield, CheckCircle2, X, ChevronRight,
  Phone, Star, Clock, Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import ScrollReveal from '../../components/ui/ScrollReveal'
import clsx from 'clsx'

interface InsuranceProduct {
  id: string
  name: string
  tagline: string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  premium: string
  coverage: string
  features: string[]
  badge?: string
  rating: number
  claimSettlement: string
}

const PRODUCTS: InsuranceProduct[] = [
  {
    id: 'health',
    name: 'NovShield Health',
    tagline: 'Complete family health protection',
    icon: <Heart size={26} />,
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-50 text-rose-600',
    premium: '₹499/month',
    coverage: 'Up to ₹10 Lakh',
    badge: 'Most Popular',
    rating: 4.8,
    claimSettlement: '97.2%',
    features: [
      'Cashless treatment at 10,000+ hospitals',
      'No room rent capping',
      'Pre & post hospitalisation cover',
      'Annual health check-up',
      'Mental wellness cover',
      'Day-care procedures included',
    ],
  },
  {
    id: 'term',
    name: 'NovLife Term',
    tagline: 'Secure your family\'s future',
    icon: <Shield size={26} />,
    gradient: 'from-novbank-700 to-novbank-900',
    iconBg: 'bg-novbank-50 text-novbank-700',
    premium: '₹699/month',
    coverage: '₹1 Crore life cover',
    badge: 'Best Value',
    rating: 4.9,
    claimSettlement: '99.1%',
    features: [
      '₹1 Crore life cover at low premium',
      'Critical illness rider available',
      'Accidental death benefit',
      'Waiver of premium on disability',
      'Tax benefit under Sec 80C & 10(10D)',
      'Online policy issuance in 5 minutes',
    ],
  },
  {
    id: 'motor',
    name: 'NovDrive Motor',
    tagline: 'Comprehensive car & bike insurance',
    icon: <Car size={26} />,
    gradient: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-blue-50 text-blue-600',
    premium: '₹3,500/year',
    coverage: 'Comprehensive cover',
    rating: 4.6,
    claimSettlement: '95.8%',
    features: [
      'Zero depreciation add-on available',
      'Roadside assistance 24×7',
      'Cashless repairs at 7,000+ garages',
      'Engine protection cover',
      'Personal accident cover of ₹15 Lakh',
      'Instant online renewal',
    ],
  },
  {
    id: 'travel',
    name: 'NovTravel Guard',
    tagline: 'Worry-free international travel',
    icon: <Plane size={26} />,
    gradient: 'from-teal-500 to-emerald-500',
    iconBg: 'bg-teal-50 text-teal-600',
    premium: '₹350/trip',
    coverage: 'Up to $1,00,000',
    rating: 4.7,
    claimSettlement: '96.4%',
    features: [
      'Medical expenses up to $1,00,000',
      'Trip cancellation & delay cover',
      'Lost baggage & passport cover',
      'Emergency evacuation',
      'Adventure sports add-on available',
      'COVID-19 cover included',
    ],
  },
  {
    id: 'home',
    name: 'NovHome Protect',
    tagline: 'Protect your home & belongings',
    icon: <Home size={26} />,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-50 text-amber-600',
    premium: '₹1,200/year',
    coverage: 'Up to ₹50 Lakh',
    rating: 4.5,
    claimSettlement: '94.7%',
    features: [
      'Fire, flood & natural disaster cover',
      'Burglary & theft protection',
      'Jewellery & electronics coverage',
      'Liability for third-party injury',
      'Rent coverage during repairs',
      'Quick claim settlement in 7 days',
    ],
  },
]

function ApplyModal({ product, onClose }: { product: InsuranceProduct; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({ name: '', dob: '', mobile: '', email: '', sumInsured: '' })
  const [loading, setLoading] = useState(false)

  function set(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(`${product.name} application submitted! Our advisor will contact you within 24 hours.`)
      onClose()
    }, 1500)
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
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={clsx('px-5 py-4 bg-gradient-to-r text-white', product.gradient)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                {product.icon}
              </div>
              <div>
                <p className="font-bold text-sm">{product.name}</p>
                <p className="text-white/70 text-xs">{product.coverage} · {product.premium}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={clsx(
                'h-1 flex-1 rounded-full transition-all',
                step >= s ? 'bg-white' : 'bg-white/30'
              )} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-white/60 mt-1">
            <span>Personal Details</span>
            <span>Review & Submit</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    className="input text-sm" placeholder="As on Aadhaar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                  <input required type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
                    className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                <input required value={form.mobile} onChange={e => set('mobile', e.target.value)}
                  className="input text-sm" placeholder="10-digit mobile" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input text-sm" placeholder="policy documents will be sent here" />
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Review Details</div>
                {[['Name', form.name], ['DOB', form.dob], ['Mobile', form.mobile], ['Email', form.email]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-novbank-50 border border-novbank-200 rounded-xl p-3 space-y-1.5">
                <div className="text-xs font-semibold text-novbank-700 mb-1">Selected Plan</div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-novbank-800">{product.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage</span>
                  <span className="font-medium">{product.coverage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Premium</span>
                  <span className="font-bold text-novbank-700">{product.premium}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                By submitting, you agree to our terms. Our insurance advisor will call you to complete KYC and process your policy.
              </p>
            </>
          )}

          <div className="flex gap-3 pt-1">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                Back
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : step === 1 ? 'Continue' : 'Submit Application'
              }
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function Insurance() {
  const [applyTarget, setApplyTarget] = useState<InsuranceProduct | null>(null)

  return (
    <BankingLayout>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <ScrollReveal>
          <div className="bg-gradient-to-r from-novbank-950 via-novbank-900 to-novbank-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full border border-white/5" />
            <div className="absolute -bottom-8 right-24 w-32 h-32 rounded-full border border-white/5" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-novbank-gold/20 border border-novbank-gold/30 flex items-center justify-center">
                  <Shield size={16} className="text-novbank-gold" />
                </div>
                <span className="text-novbank-gold text-xs font-semibold uppercase tracking-widest">NovBank Insurance</span>
              </div>
              <h1 className="text-white text-3xl font-bold mb-2">Protect What Matters</h1>
              <p className="text-white/60 text-sm max-w-xl">
                Comprehensive insurance solutions — health, life, motor, travel & home — powered by India's top insurers and managed through your NovBank account.
              </p>
              <div className="flex flex-wrap gap-4 mt-5">
                {[
                  { icon: <Users size={14} />, text: '2.4M+ customers protected' },
                  { icon: <Clock size={14} />, text: 'Instant policy issuance' },
                  { icon: <CheckCircle2 size={14} />, text: '96% avg claim settlement' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2 text-white/70 text-xs">
                    <span className="text-novbank-gold">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {PRODUCTS.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className={clsx('bg-gradient-to-r p-5 text-white relative overflow-hidden', product.gradient)}>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 scale-[2.5]">
                    {product.icon}
                  </div>
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        {product.icon}
                      </div>
                      <div>
                        {product.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/25 text-white mb-1 inline-block">
                            {product.badge}
                          </span>
                        )}
                        <div className="font-bold text-sm">{product.name}</div>
                        <div className="text-white/70 text-xs">{product.tagline}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <div>
                      <div className="text-white/50 text-[10px] uppercase tracking-wider">Premium</div>
                      <div className="font-bold text-sm">{product.premium}</div>
                    </div>
                    <div className="w-px bg-white/20" />
                    <div>
                      <div className="text-white/50 text-[10px] uppercase tracking-wider">Coverage</div>
                      <div className="font-bold text-sm">{product.coverage}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={9} fill={j < Math.floor(product.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <div className="text-xs font-bold text-gray-700">{product.rating}/5</div>
                    <div className="text-[10px] text-gray-400">Customer Rating</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-xs font-bold text-emerald-600">{product.claimSettlement}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Claim Settlement</div>
                  </div>
                </div>

                {/* Features */}
                <div className="p-4 flex-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Key Benefits</div>
                  <ul className="space-y-2">
                    {product.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <button
                    onClick={() => setApplyTarget(product)}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5"
                  >
                    Apply Now <ChevronRight size={14} />
                  </button>
                  <button className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <Phone size={15} />
                  </button>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-xs text-gray-400 max-w-2xl mx-auto">
          Insurance is the subject matter of solicitation. Products are offered by NovBank's partner insurers.
          Please read policy terms carefully before purchase. IRDAI Registration No. XXXXX.
        </div>
      </div>

      <AnimatePresence>
        {applyTarget && (
          <ApplyModal product={applyTarget} onClose={() => setApplyTarget(null)} />
        )}
      </AnimatePresence>
    </BankingLayout>
  )
}
