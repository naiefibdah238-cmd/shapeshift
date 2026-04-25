'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setPwLoading(true)
    setPwError('')
    setPwMessage('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError(error.message)
    } else {
      setPwMessage('Password updated.')
      setNewPassword('')
    }
    setPwLoading(false)
  }

  async function handleDeleteAccount() {
    // Delete plans first (RLS handles it), then sign out
    // Full account deletion requires a server-side admin call — redirect to support email
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
          <p className="text-sm text-muted">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-10">Account</h1>

        <div className="max-w-md space-y-10">
          {/* Email section */}
          <section>
            <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-3">Email</p>
            <div className="border border-rule bg-white px-4 py-3">
              <p className="text-sm text-ink">{user?.email}</p>
            </div>
          </section>

          {/* Change password */}
          <section>
            <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-3">Change password</p>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="label">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="8+ characters"
                  minLength={8}
                />
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              {pwMessage && <p className="text-sm text-green-700">{pwMessage}</p>}
              <button type="submit" disabled={pwLoading} className="btn-secondary text-xs px-4 py-2 disabled:opacity-50">
                {pwLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </section>

          {/* Delete account */}
          <section className="border-t border-rule pt-8">
            <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-3">Danger zone</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Delete account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink">
                  This will sign you out. To fully delete your account and data, email{' '}
                  <a href="mailto:hello@shapeshift.app" className="underline underline-offset-2">
                    hello@shapeshift.app
                  </a>.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount} className="btn-primary text-xs px-4 py-2 bg-red-600 hover:bg-red-700">
                    Sign out
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
