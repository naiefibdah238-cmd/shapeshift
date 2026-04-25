'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import WeeklyGrid from '@/components/WeeklyGrid'
import SessionSwapModal from '@/components/SessionSwapModal'
import { generatePlan } from '@/lib/programming-logic'
import type { WeeklyPlan, DayPlan } from '@/lib/programming-logic'
import { createClient } from '@/lib/supabase'

interface DBPlan {
  id: string
  name: string
  inputs: WeeklyPlan['inputs']
  schedule: DayPlan[]
  programming_notes: string
  created_at: string
}

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength-biased',
  endurance: 'Endurance-biased',
  balanced: 'Balanced hybrid',
  recomp: 'Body recomp',
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [dbPlan, setDbPlan] = useState<DBPlan | null>(null)
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [swapDayIndex, setSwapDayIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [seed, setSeed] = useState(1)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      const db = data as DBPlan
      setDbPlan(db)
      setNameValue(db.name)
      setPlan({
        days: db.schedule,
        programmingNotes: db.programming_notes,
        inputs: db.inputs,
      })
      setLoading(false)
    }
    load()
  }, [id])

  async function savePlanToDB(updatedPlan: WeeklyPlan, newName?: string) {
    if (!dbPlan) return
    await supabase
      .from('plans')
      .update({
        schedule: updatedPlan.days,
        programming_notes: updatedPlan.programmingNotes,
        inputs: updatedPlan.inputs,
        ...(newName !== undefined ? { name: newName } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbPlan.id)
  }

  async function handleSaveName() {
    if (!plan || !nameValue.trim()) return
    setSavingName(true)
    await savePlanToDB(plan, nameValue.trim())
    setDbPlan(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
    setSavingName(false)
    setEditingName(false)
  }

  function handleSwap(dayIndex: number, newSession: DayPlan) {
    if (!plan) return
    const newDays = plan.days.map((d, i) => i === dayIndex ? newSession : d)
    const updatedPlan = { ...plan, days: newDays }
    setPlan(updatedPlan)
    setSwapDayIndex(null)
    savePlanToDB(updatedPlan)
  }

  function handleRegenerate() {
    if (!plan) return
    const newPlan = generatePlan(plan.inputs, seed)
    setPlan(newPlan)
    setSeed(s => s + 1)
    setShowRegenConfirm(false)
    savePlanToDB(newPlan)
  }

  async function handleDelete() {
    if (!dbPlan) return
    await supabase.from('plans').delete().eq('id', dbPlan.id)
    router.push('/dashboard')
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

  if (notFound || !plan) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
          <p className="text-sm text-muted mb-4">Plan not found.</p>
          <Link href="/dashboard" className="text-sm text-ink underline underline-offset-2">
            Back to my plans
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs text-muted">
          <Link href="/dashboard" className="hover:text-ink transition-colors">My plans</Link>
          <span>/</span>
          <span className="text-ink">{dbPlan?.name}</span>
        </div>

        {/* Plan header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="input-field text-xl font-semibold max-w-sm"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={savingName} className="btn-primary text-xs px-3 py-2">
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingName(false)} className="btn-ghost text-xs">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-2"
                title="Click to edit name"
              >
                <h1 className="text-2xl font-semibold text-ink tracking-tight group-hover:text-accent transition-colors">
                  {dbPlan?.name}
                </h1>
                <svg className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <p className="text-sm text-muted mt-1">
              {plan.inputs.trainingDays} days/wk — {GOAL_LABELS[plan.inputs.primaryGoal]}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowRegenConfirm(true)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Regenerate
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-ghost text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        <p className="text-xs text-muted mb-6">
          Click any session to swap it for a valid alternative.
        </p>

        {/* Weekly grid */}
        <WeeklyGrid plan={plan} onSwap={setSwapDayIndex} swappable={true} />

        {/* Programming notes */}
        <div className="mt-8 max-w-3xl">
          <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-4">
            Programming notes
          </p>
          <div className="border border-rule bg-white p-6 space-y-4">
            {plan.programmingNotes.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-ink leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Swap modal */}
      {swapDayIndex !== null && (
        <SessionSwapModal
          plan={plan}
          dayIndex={swapDayIndex}
          onSelect={handleSwap}
          onClose={() => setSwapDayIndex(null)}
        />
      )}

      {/* Regenerate confirm */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-paper border border-rule p-6 max-w-sm w-full mx-4 shadow-2xl">
            <p className="text-sm font-medium text-ink mb-2">Regenerate this plan?</p>
            <p className="text-sm text-muted mb-6">
              This will replace the current arrangement with a new valid schedule using the same inputs.
            </p>
            <div className="flex gap-2">
              <button onClick={handleRegenerate} className="btn-primary text-xs px-4 py-2">
                Regenerate
              </button>
              <button onClick={() => setShowRegenConfirm(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-paper border border-rule p-6 max-w-sm w-full mx-4 shadow-2xl">
            <p className="text-sm font-medium text-ink mb-2">Delete this plan?</p>
            <p className="text-sm text-muted mb-6">
              This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700 text-xs px-4 py-2">
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
