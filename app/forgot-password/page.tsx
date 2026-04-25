'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-sm font-semibold tracking-tight text-ink mb-8">
          Shape.shift
        </Link>

        <h1 className="text-xl font-semibold text-ink mb-2">Reset password</h1>

        {done ? (
          <div className="py-4">
            <p className="text-sm font-medium text-ink mb-2">Email sent</p>
            <p className="text-sm text-muted mb-6">
              Check <strong>{email}</strong> for a password reset link.
            </p>
            <Link href="/login" className="text-sm text-ink underline underline-offset-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-6">
              Enter your email and we&apos;ll send a reset link.
            </p>
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
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <Link href="/login" className="block text-sm text-muted hover:text-ink transition-colors text-center pt-2">
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
