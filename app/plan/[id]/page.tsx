'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import WeeklyGrid from '@/components/WeeklyGrid'
import SessionSwapModal from '@/components/SessionSwapModal'
import { generatePlan, downloadPlan } from '@/lib/programming-logic'
import type { WeeklyPlan, DayPlan } from '@/lib/programming-logic'
import { createClient } from '@/lib/supabase'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import ParallaxHero from '@/components/ParallaxHero'

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
  const { toast, showToast } = useToast()

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

  async function savePlanToDB(updatedPlan: WeeklyPlan, newName?: string): Promise<boolean> {
    if (!dbPlan) return false
    const { error } = await supabase
      .from('plans')
      .update({
        schedule: updatedPlan.days,
        programming_notes: updatedPlan.programmingNotes,
        inputs: updatedPlan.inputs,
        ...(newName !== undefined ? { name: newName } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbPlan.id)
    if (error) {
      showToast('Failed to save changes. Try again.', 'error')
      return false
    }
    return true
  }

  async function handleSaveName() {
    if (!plan || !nameValue.trim()) return
    setSavingName(true)
    const ok = await savePlanToDB(plan, nameValue.trim())
    if (ok) {
      setDbPlan(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
      showToast('Name saved')
    }
    setSavingName(false)
  }

  async function handleSwap(dayIndex: number, newSession: DayPlan) {
    if (!plan) return
    const newDays = plan.days.map((d, i) => i === dayIndex ? newSession : d)
    const updatedPlan = { ...plan, days: newDays }
    setPlan(updatedPlan)
    setSwapDayIndex(null)
    const ok = await savePlanToDB(updatedPlan)
    if (ok) showToast('Session swapped')
  }

  async function handleRegenerate() {
    if (!plan) return
    const newPlan = generatePlan(plan.inputs, seed)
    setPlan(newPlan)
    setSeed(s => s + 1)
    setShowRegenConfirm(false)
    const ok = await savePlanToDB(newPlan)
    if (ok) showToast('Plan regenerated')
  }

  async function handleDelete() {
    if (!dbPlan) return
    const { error } = await supabase.from('plans').delete().eq('id', dbPlan.id)
    if (error) { showToast('Failed to delete plan. Try again.', 'error'); return }
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="h-52 bg-stone-900 animate-pulse" />
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 space-y-4">
          <div className="h-4 w-32 bg-rule rounded animate-pulse" />
          <div className="h-8 w-64 bg-rule rounded animate-pulse" />
          <div className="h-4 w-48 bg-rule rounded animate-pulse" />
        </main>
      </div>
    )
  }

  if (notFound || !plan) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-24 text-center">
          <p className="text-2xl font-bold text-ink mb-2">Plan not found</p>
          <p className="text-sm text-muted mb-6">This plan may have been deleted or doesn&apos;t belong to your account.</p>
          <Link href="/dashboard" className="btn-primary text-xs px-6 py-3">Back to my plans</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <ParallaxHero imageUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1800&q=80&fit=crop">
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-8 animate-fade-up">
          <Link href="/dashboard" className="text-2xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest mb-3 block">
            ← My plans
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    className="bg-white/10 border border-white/30 text-white px-3 py-1.5 text-lg font-semibold focus:outline-none focus:border-white/60 w-64"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="text-xs text-white/70 hover:text-white border border-white/30 px-3 py-1.5 transition-colors">
                    {savingName ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-xs text-white/40 hover:text-white/70 transition-colors">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditingName(true)} className="group flex items-center gap-2 text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight group-hover:text-white/80 transition-colors">
                    {dbPlan?.name}
                  </h1>
                  <svg className="w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <p className="text-sm text-white/50 mt-1">
                {plan.inputs.trainingDays} days/wk · {GOAL_LABELS[plan.inputs.primaryGoal]}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => plan && downloadPlan(plan)} className="text-xs text-white/70 hover:text-white border border-white/30 hover:border-white/60 px-4 py-2 transition-all">
                Download
              </button>
              <button onClick={() => setShowRegenConfirm(true)} className="text-xs text-white/70 hover:text-white border border-white/30 hover:border-white/60 px-4 py-2 transition-all">
                Regenerate
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 px-4 py-2 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      </ParallaxHero>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <p className="text-xs text-muted mb-6 animate-fade-up">
          Click any session to swap it for a valid alternative.
        </p>

        {/* Weekly grid */}
        <WeeklyGrid plan={plan} onSwap={setSwapDayIndex} swappable={true} />

        {/* Programming notes */}
        <div className="mt-8 max-w-3xl reveal">
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

      {toast && <Toast message={toast.message} type={toast.type} />}

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
