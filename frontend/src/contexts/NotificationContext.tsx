import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { notificationsApi } from '../api/notifications'
import { useAuth } from './AuthContext'

interface NotificationContextValue {
  unreadCount: number
  decrement: (by?: number) => void
  resetToZero: () => void
  refetch: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  decrement: () => {},
  resetToZero: () => {},
  refetch: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const latestCountRef = useRef(0)

  const fetch = useCallback(() => {
    if (!user || user.role !== 'customer') return
    notificationsApi.getUnreadCount()
      .then(({ count }) => {
        latestCountRef.current = count
        setUnreadCount(count)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [fetch])

  const decrement = useCallback((by = 1) => {
    setUnreadCount(prev => {
      const next = Math.max(0, prev - by)
      latestCountRef.current = next
      return next
    })
  }, [])

  const resetToZero = useCallback(() => {
    latestCountRef.current = 0
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider value={{ unreadCount, decrement, resetToZero, refetch: fetch }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
