import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export function useInView(options: UseInViewOptions = {}): [React.RefObject<HTMLDivElement>, boolean] {
  const { threshold = 0.1, triggerOnce = true, rootMargin = '0px' } = options
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            observer.unobserve(el)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)

    return () => {
      observer.unobserve(el)
    }
  }, [threshold, triggerOnce, rootMargin])

  return [ref, isInView]
}
