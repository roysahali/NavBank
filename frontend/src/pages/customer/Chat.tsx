import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Bot,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import BankingLayout from '../../components/layout/BankingLayout'
import { chatApi } from '../../api/chat'
import type { ChatMessageOut, ChatSessionDetail, ChatSessionOut } from '../../api/chat'
import { formatDateTime, formatDate } from '../../utils/formatters'

const QUICK_ACTIONS = [
  'What is my account balance?',
  'Show my recent transactions',
  'What are my active loans?',
  'Credit card outstanding amount',
  'How to do a NEFT transfer?',
  'What is the RTGS limit?',
  'Explain fixed deposit rates',
  'Help me calculate EMI',
]

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
      className={clsx('flex gap-3 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center shrink-0 mb-1">
          <Bot size={15} className="text-white" />
        </div>
      )}
      <div className={clsx('max-w-[75%] flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-novbank-700 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
        )}>
          {lines.map((line, i) => {
            const parts = line.split(/\*\*(.+?)\*\*/g)
            return (
              <span key={i}>
                {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                {i < lines.length - 1 && <br />}
              </span>
            )
          })}
        </div>
        <span className="text-[11px] text-gray-400 px-1">{formatDateTime(msg.created_at)}</span>
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSessionOut[]>([])
  const [activeSession, setActiveSession] = useState<ChatSessionDetail | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
  }, [])

  useEffect(() => {
    chatApi.listSessions()
      .then((data) => setSessions(data))
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    if (activeSession) scrollToBottom()
  }, [activeSession?.messages, typing])

  async function openSession(id: number) {
    if (activeSession?.id === id) return
    setLoadingSession(true)
    try {
      const detail = await chatApi.getSession(id)
      setActiveSession(detail)
      scrollToBottom()
    } catch {
      toast.error('Failed to load session')
    } finally {
      setLoadingSession(false)
    }
  }

  async function newSession() {
    setLoadingSession(true)
    try {
      const detail = await chatApi.createSession()
      setActiveSession(detail)
      setSessions((prev) => [
        { ...detail, message_count: detail.messages.length },
        ...prev,
      ])
      scrollToBottom()
    } catch {
      toast.error('Failed to start new chat')
    } finally {
      setLoadingSession(false)
    }
  }

  async function deleteSession(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await chatApi.deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (activeSession?.id === id) setActiveSession(null)
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setDeletingId(null)
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || !activeSession || sending) return
    setInput('')
    setSending(true)

    const tempUser: ChatMessageOut = {
      id: Date.now(),
      session_id: activeSession.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, tempUser] } : prev)
    setTyping(true)
    scrollToBottom()

    try {
      const aiMsg = await chatApi.sendMessage(activeSession.id, content)
      setTyping(false)
      setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : prev)
      setSessions((prev) => prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, message_count: s.message_count + 2, updated_at: aiMsg.created_at }
          : s
      ))
    } catch {
      setTyping(false)
      const err: ChatMessageOut = {
        id: Date.now() + 1,
        session_id: activeSession.id,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      }
      setActiveSession((prev) => prev ? { ...prev, messages: [...prev.messages, err] } : prev)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <BankingLayout>
      <div className="flex h-[calc(100vh-0px)] lg:h-screen overflow-hidden">
        {/* Session list sidebar */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">Chat History</h2>
                <p className="text-xs text-gray-400">AI-powered banking assistant</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-novbank-50 flex items-center justify-center">
                <Sparkles size={15} className="text-novbank-700" />
              </div>
            </div>
            <button
              onClick={newSession}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-novbank-700 hover:bg-novbank-800 text-white text-sm font-medium transition-colors"
            >
              <Plus size={15} />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageCircle size={32} className="text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-300 text-xs">Start a new chat above</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={clsx(
                    'group mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex items-start gap-2',
                    activeSession?.id === s.id
                      ? 'bg-novbank-50 border border-novbank-100'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-novbank-600 to-novbank-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(s.updated_at)} · {s.message_count} msgs</p>
                  </div>
                  <button
                    onClick={(e) => deleteSession(e, s.id)}
                    disabled={deletingId === s.id}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {!activeSession ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center mb-6 shadow-lg">
                <Sparkles size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Meet Nova</h1>
              <p className="text-gray-500 max-w-sm mb-8">
                Your AI-powered banking assistant. Ask me anything about your accounts,
                transactions, loans, or banking services.
              </p>
              <button
                onClick={newSession}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-novbank-700 hover:bg-novbank-800 text-white font-medium transition-colors shadow-md"
              >
                <Plus size={18} />
                Start a new conversation
              </button>
              <div className="mt-10 w-full max-w-lg">
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide font-medium">Try asking</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={async () => {
                        await newSession()
                      }}
                      className="text-left px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-novbank-200 hover:text-novbank-700 transition-colors flex items-center gap-2 group"
                    >
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-novbank-400 shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center">
                  <Bot size={17} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{activeSession.title}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-gray-400">Nova · AI Banking Assistant</span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={(e) => deleteSession(e, activeSession.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="Delete this chat"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={newSession}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-novbank-50 hover:bg-novbank-100 text-novbank-700 text-xs font-medium transition-colors"
                  >
                    <Plus size={13} />
                    New Chat
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scroll-smooth">
                {loadingSession ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400 text-sm">Loading…</div>
                  </div>
                ) : (
                  <>
                    {activeSession.messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} isUser={msg.role === 'user'} />
                    ))}
                    {typing && (
                      <div className="flex gap-3 items-end">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-novbank-700 to-novbank-600 flex items-center justify-center shrink-0">
                          <Bot size={15} className="text-white" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                          <TypingDots />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Quick actions on first message */}
              {activeSession.messages.length === 1 && (
                <div className="px-6 pb-3">
                  <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Suggested questions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.slice(0, 5).map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-novbank-200 hover:text-novbank-700 transition-colors shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input bar */}
              <div className="bg-white border-t border-gray-100 px-4 py-4">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <textarea
                    ref={inputRef}
                    className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-novbank-300 max-h-32 min-h-[46px] bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Ask Nova anything about your accounts, transfers, loans…"
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                    }}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || sending}
                    className="w-11 h-11 rounded-xl bg-novbank-700 hover:bg-novbank-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <p className="text-center text-[11px] text-gray-300 mt-2">
                  Nova may occasionally make mistakes. Verify important financial decisions with NovBank staff.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </BankingLayout>
  )
}
