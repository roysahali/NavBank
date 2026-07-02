import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColors = ['', 'bg-red-500', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500']
const strengthTextColors = ['', 'text-red-500', 'text-amber-500', 'text-yellow-600', 'text-emerald-600']

const strengthHints: Record<number, string> = {
  0: 'add uppercase, number & symbol',
  1: 'add uppercase, number & symbol',
  2: 'add a number & special character',
  3: 'add a special character',
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', mobile: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const strength = getPasswordStrength(form.password)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        mobile: form.mobile,
      })
      login(res.access_token, res.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-novbank-950">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-novbank-950 via-novbank-900 to-novbank-800" />

        {/* Decorative rings */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full border border-white/5" />
        <div className="absolute top-[-40px] left-[-40px] w-56 h-56 rounded-full border border-white/5" />
        <div className="absolute bottom-[-100px] right-[-60px] w-96 h-96 rounded-full border border-white/5" />
        <div className="absolute bottom-[-60px] right-[-30px] w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-novbank-gold/10 via-transparent to-transparent" />

        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-16 w-20 h-20 rounded-full border border-novbank-gold/20 bg-novbank-gold/5"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 right-32 w-10 h-10 rounded-full border border-novbank-gold/10 bg-novbank-gold/5"
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-novbank-gold to-novbank-gold-light flex items-center justify-center shadow-lg shadow-novbank-gold/20">
              <Shield size={22} className="text-novbank-950" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-wide">NovBank</div>
              <div className="text-white/40 text-xs tracking-widest uppercase">Internet Banking</div>
            </div>
          </div>

          {/* Main content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                Join NovBank{' '}
                <span className="bg-gradient-to-r from-novbank-gold to-novbank-gold-light bg-clip-text text-transparent">
                  Today
                </span>
              </h1>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Open a free savings account in minutes. Powered by AI insights and protected by bank-grade security.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 space-y-3"
            >
              {[
                { icon: '⚡', text: 'Instant account setup — no paperwork' },
                { icon: '🤖', text: 'AI-powered spending insights' },
                { icon: '🔐', text: 'Secure transfers with NEFT, RTGS & UPI' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-novbank-gold/10 flex items-center justify-center text-sm shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-white/60 text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="mt-10 grid grid-cols-3 gap-4"
            >
              {[
                { value: '₹0', label: 'Setup Fee' },
                { value: 'Instant', label: 'KYC' },
                { value: 'AI', label: 'Banking' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                  <div className="text-xl font-bold text-novbank-gold">{stat.value}</div>
                  <div className="text-white/40 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 space-y-2"
            >
              {[
                'Zero-fee savings account for life',
                'UPI ID created automatically on registration',
                'DICGC insured up to ₹5,00,000',
                '24/7 AI support & real-time alerts',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-novbank-gold shrink-0" />
                  <span className="text-white/50 text-sm">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/20 text-xs">
            © 2026 NovBank. Regulated by RBI. DICGC Insured up to ₹5,00,000.
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-novbank-gold to-novbank-gold-light flex items-center justify-center">
              <Shield size={18} className="text-novbank-950" />
            </div>
            <div className="text-novbank-900 font-bold text-xl">NovBank</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1 text-sm">Free savings account opened instantly</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"
            >
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name + Mobile — 2 col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={set('full_name')}
                    className="input pl-10"
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="label">Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-medium pointer-events-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <Phone size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                    }
                    className="input pl-16 pr-9"
                    placeholder="98765 43210"
                    required
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input pl-10 pr-10"
                  placeholder="Min 8 characters"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= seg ? strengthColors[strength] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>
                    {strengthLabels[strength]}
                    {strength < 4 && (
                      <span className="text-gray-400 font-normal ml-1">
                        — {strengthHints[strength]}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-novbank-700 font-semibold hover:text-novbank-800 hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-5 text-center text-xs text-gray-400">
            🔒 256-bit SSL &nbsp;·&nbsp; RBI Regulated &nbsp;·&nbsp; DICGC Insured
          </p>
        </motion.div>
      </div>
    </div>
  )
}
