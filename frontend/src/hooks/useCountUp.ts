import { useEffect, useRef, useState } from 'react'

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(target: number, duration = 1500, startOnMount = true): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!startOnMount && !startedRef.current) return

    startedRef.current = true
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOut(progress)
      setValue(Math.round(easedProgress * target * 100) / 100)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target, duration, startOnMount])

  return value
}
