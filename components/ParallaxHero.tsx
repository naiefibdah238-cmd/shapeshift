'use client'
import { useEffect, useRef } from 'react'

interface Props {
  imageUrl: string
  children: React.ReactNode
  className?: string
}

export default function ParallaxHero({ imageUrl, children, className = 'h-52 lg:h-64' }: Props) {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bgRef.current
    if (!el) return
    const parent = el.parentElement!

    function update() {
      if (!el) return
      const rect = parent.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return
      const progress = rect.top / window.innerHeight
      el.style.transform = `translateY(${progress * -50}px) scale(1.15)`
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <section className={`relative ${className} flex items-end overflow-hidden`}>
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')`, willChange: 'transform' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
      {children}
    </section>
  )
}
