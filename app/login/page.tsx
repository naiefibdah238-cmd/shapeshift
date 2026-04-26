'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = next
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="flex items-center justify-between text-sm text-muted pt-2">
        <Link href="/forgot-password" className="hover:text-ink transition-colors">
          Forgot password?
        </Link>
        <Link href={`/signup?next=${next}`} className="hover:text-ink transition-colors">
          Create account
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* Left: hero panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=80&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/95 via-ink/85 to-ink/60" />

        {/* Logo */}
        <div className="relative z-10 animate-fade-up">
          <Link href="/" className="text-sm font-semibold tracking-tight text-white">
            Shape.shift
          </Link>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 space-y-8">
          <div className="animate-fade-up delay-100">
            <h2 className="text-3xl font-bold text-white leading-snug mb-3">
              Train smarter.<br />Track everything.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              A hybrid training planner built for athletes who lift and run.
            </p>
          </div>

          <div className="space-y-2.5 animate-fade-up delay-200">
            {[
              'Weekly training planner with smart scheduling',
              'Nutrition calculator & macro targets',
              'Food log to track your daily intake',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">—</span>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>

          {/* Free badge */}
          <div className="border border-white/15 bg-white/5 px-5 py-4 animate-fade-up delay-300">
            <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-1">
              100% Free
            </p>
            <p className="text-white/80 text-sm leading-relaxed">
              No subscription. No hidden fees. No credit card — ever.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="block lg:hidden text-sm font-semibold tracking-tight text-ink mb-8 animate-fade-up">
            Shape.shift
          </Link>

          <div className="animate-fade-up">
            <h1 className="text-xl font-semibold text-ink mb-1">Sign in</h1>
            <p className="text-sm text-muted mb-6">
              Free forever —{' '}
              <span className="text-accent font-medium">no credit card, no hidden fees.</span>
            </p>
          </div>

          <div className="animate-fade-up delay-100">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>

    </div>
  )
}
