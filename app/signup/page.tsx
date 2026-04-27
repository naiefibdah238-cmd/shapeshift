'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/planner'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <p className="text-sm font-medium text-ink mb-2">Check your email</p>
        <p className="text-sm text-muted">
          We sent a confirmation link to <strong>{email}</strong>.
          Click it to activate your account and you&apos;ll be redirected to your plan.
        </p>
      </div>
    )
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
          placeholder="8+ characters"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-sm text-muted text-center pt-2">
        Already have an account?{' '}
        <Link href="/login" className="text-ink hover:text-accent transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-sm font-semibold tracking-tight text-ink mb-8">
          Shape.shift
        </Link>
        <h1 className="text-xl font-semibold text-ink mb-2">Create account</h1>
        <p className="text-sm text-muted mb-6">
          Free. No credit card. Just a place to save your training weeks.
        </p>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
