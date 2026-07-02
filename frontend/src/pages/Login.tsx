import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Eye, EyeOff, Smartphone, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

type Tab = 'password' | 'otp'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('password')

  // Password login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // OTP state
  const [mobile, setMobile] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const data = await authApi.login({ email, password })
      login(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.full_name.split(' ')[0]}!`)
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit Indian mobile number')
      return
    }
    setOtpLoading(true)
    try {
      await authApi.sendOtp(mobile)
      setOtpSent(true)
      toast.success('OTP sent to your mobile number')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length !== 6) {
      toast.error('Enter the 6-digit OTP')
      return
    }
    setVerifyLoading(true)
    try {
      const data = await authApi.verifyOtp(mobile, otpCode)
      login(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.full_name.split(' ')[0]}!`)
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-novbank-950">
      <Toaster position="top-center" />

      {/* Left panel - brand */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden">
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
                Your Money,<br />
                <span className="bg-gradient-to-r from-novbank-gold to-novbank-gold-light bg-clip-text text-transparent">
                  Always Secure.
                </span>
              </h1>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Experience premium banking with real-time transfers, AI-powered insights, and bank-grade security — all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: '10L+', label: 'Happy Customers' },
                { value: '₹500Cr+', label: 'Assets Under Mgmt' },
                { value: '99.9%', label: 'Uptime SLA' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-novbank-gold">{stat.value}</div>
                  <div className="text-white/40 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 space-y-2.5"
            >
              {[
                'NEFT, RTGS & IMPS transfers in real-time',
                'UPI integration with instant payments',
                'Credit cards with reward point tracking',
                'AI-powered spending insights',
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

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
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
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your NovBank account</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8">
            {(['password', 'otp'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setOtpSent(false)
                  setOtpCode('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-white text-novbank-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'password' ? <Lock size={14} /> : <Smartphone size={14} />}
                {t === 'password' ? 'Password' : 'Mobile OTP'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'password' ? (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePasswordLogin}
                className="space-y-5"
              >
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {loginLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight size={16} /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {!otpSent ? (
                    <motion.form
                      key="send-otp"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSendOtp}
                      className="space-y-5"
                    >
                      <div>
                        <label className="label">Mobile Number</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="input pl-20"
                            placeholder="98765 43210"
                            required
                            maxLength={10}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={otpLoading || mobile.length !== 10}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {otpLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Send OTP <ArrowRight size={16} /></>
                        )}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="verify-otp"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleVerifyOtp}
                      className="space-y-5"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        <p className="text-green-800 text-sm">
                          OTP sent to +91 {mobile.slice(0, 5)}•••••
                        </p>
                      </div>
                      <div>
                        <label className="label">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="input text-center text-xl font-mono tracking-[0.5em]"
                          placeholder="••••••"
                          maxLength={6}
                          autoFocus
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifyLoading || otpCode.length !== 6}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {verifyLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Verify &amp; Login <ArrowRight size={16} /></>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode('') }}
                        className="text-sm text-gray-500 hover:text-novbank-600 w-full text-center"
                      >
                        Change mobile number
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div><span className="text-gray-400">Customer:</span> alice@example.com / Alice@123</div>
              <div><span className="text-gray-400">Admin:</span> admin@novbank.com / Admin@123</div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            🔒 256-bit SSL encrypted · RBI Regulated · DICGC Insured
          </p>
        </motion.div>
      </div>
    </div>
  )
}
