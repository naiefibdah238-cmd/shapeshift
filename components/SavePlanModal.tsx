'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { WeeklyPlan } from '@/lib/programming-logic'
import type { User } from '@supabase/supabase-js'

interface Props {
  plan: WeeklyPlan
  user: User | null
  onClose: () => void
}

export default function SavePlanModal({ plan, user, onClose }: Props) {
  const [planName, setPlanName] = useState('My hybrid week')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (!user) {
      // Redirect to signup with intent
      router.push('/signup?next=/planner&action=save')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data, error: dbError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          name: planName.trim() || 'My hybrid week',
          inputs: plan.inputs,
          schedule: plan.days,
          programming_notes: plan.programmingNotes,
        })
        .select('id')
        .single()

      if (dbError) throw dbError

      router.push(`/plan/${data.id}`)
    } catch (err) {
      setError('Failed to save. Try again.')
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full sm:max-w-md bg-paper border border-rule shadow-2xl">
        <div className="px-6 py-5 border-b border-rule">
          <p className="text-base font-semibold text-ink">Save this plan</p>
          {!user && (
            <p className="text-sm text-muted mt-1">
              You&apos;ll need an account to save. Takes 30 seconds.
            </p>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {user ? (
            <>
              <div>
                <label className="label">Plan name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  className="input-field"
                  placeholder="My hybrid week"
                  maxLength={80}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save plan'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button onClick={handleSave} className="btn-primary w-full">
                Create free account and save
              </button>
              <p className="text-xs text-center text-muted">
                Already have an account?{' '}
                <a href="/login?next=/planner&action=save" className="text-ink underline underline-offset-2">
                  Sign in
                </a>
              </p>
            </div>
          )}

          <button onClick={onClose} className="btn-ghost w-full text-xs mt-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
