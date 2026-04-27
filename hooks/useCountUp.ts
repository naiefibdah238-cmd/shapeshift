'use client'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    setValue(0)
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return value
}
