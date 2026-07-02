import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X, Send, RotateCcw, Bot, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { chatApi } from '../../api/chat'
import type { ChatMessageOut, ChatSessionDetail } from '../../api/chat'
import { formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../contexts/AuthContext'

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg, isUser }: { msg: ChatMessageOut; isUser: boolean }) {
  const lines = msg.content.split('\n')
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center shrink-0 mb-0.5">
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div className={clsx('max-w-[82%] flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx(
          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-novbank-700 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        )}>
          {lines.map((line, i) => {
            // Render **bold** markdown
            const parts = line.split(/\*\*(.+?)\*\*/g)
            return (
              <span key={i}>
                {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                {i < lines.length - 1 && <br />}
              </span>
            )
          })}
        </div>
        <span className="text-[10px] text-gray-400 px-1">{formatDateTime(msg.created_at)}</span>
      </div>
    </motion.div>
  )
}

const QUICK_ACTIONS = [
  'What is my balance?',
  'Show recent transactions',
  'My loan details',
  'Credit card outstanding',
  'How to do a NEFT transfer?',
]

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<ChatSessionDetail | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => {
    if (open && !session && user) {
      setLoading(true)
      chatApi.createSession()
        .then((s) => { setSession(s); scrollToBottom() })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, user])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [session?.messages, typing, open])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || !session || sending) return
    setInput('')
    setSending(true)

    // Optimistically add user message
    const tempUserMsg: ChatMessageOut = {
      id: Date.now(),
      session_id: session.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setSession((prev) => prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev)
    setTyping(true)
    scrollToBottom()

    try {
      const aiMsg = await chatApi.sendMessage(session.id, content)
      setTyping(false)
      setSession((prev) => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : prev)
    } catch {
      setTyping(false)
      const errMsg: ChatMessageOut = {
        id: Date.now() + 1,
        session_id: session.id,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      }
      setSession((prev) => prev ? { ...prev, messages: [...prev.messages, errMsg] } : prev)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  async function newChat() {
    setLoading(true)
    try {
      const s = await chatApi.createSession()
      setSession(s)
      scrollToBottom()
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'customer') return null

  return (
    <>
      {/* Floating bubble */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Chat with Nova"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Unread indicator dot — show when closed */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-novbank-gold border-2 border-white" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-novbank-900 to-novbank-800 px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-novbank-gold/20 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-novbank-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">Nova — AI Assistant</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-novbank-200 text-[11px]">Powered by AI · Always available</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={newChat} className="p-1.5 rounded-lg text-novbank-300 hover:text-white hover:bg-white/10 transition-colors" title="New chat">
                  <RotateCcw size={15} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-novbank-300 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <TypingDots />
                </div>
              ) : (
                <>
                  {session?.messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} isUser={msg.role === 'user'} />
                  ))}
                  {typing && (
                    <div className="flex gap-2 items-end">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center shrink-0">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Quick actions — show only on welcome screen */}
            {session && session.messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs px-2.5 py-1 rounded-full bg-novbank-50 text-novbank-700 hover:bg-novbank-100 border border-novbank-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 px-3 py-3 flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-novbank-300 max-h-28 min-h-[42px]"
                placeholder="Ask Nova anything…"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-xl bg-novbank-700 hover:bg-novbank-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
