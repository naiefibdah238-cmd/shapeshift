'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import PlannerForm from '@/components/PlannerForm'
import WeeklyGrid from '@/components/WeeklyGrid'
import SessionSwapModal from '@/components/SessionSwapModal'
import SavePlanModal from '@/components/SavePlanModal'
import { generatePlan, planToText } from '@/lib/programming-logic'
import type { WeeklyPlan, PlannerInputs, DayPlan } from '@/lib/programming-logic'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function PlannerPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [seed, setSeed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [swapDayIndex, setSwapDayIndex] = useState<number | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  function handleGenerate(inputs: PlannerInputs) {
    setLoading(true)
    // Small delay to show loading state (logic is synchronous but fast)
    requestAnimationFrame(() => {
      const newPlan = generatePlan(inputs, seed)
      setPlan(newPlan)
      setSeed(prev => prev + 1)
      setLoading(false)
      // Scroll to output
      setTimeout(() => {
        document.getElementById('plan-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    })
  }

  function handleRegenerate() {
    if (!plan) return
    setLoading(true)
    requestAnimationFrame(() => {
      const newPlan = generatePlan(plan.inputs, seed)
      setPlan(newPlan)
      setSeed(prev => prev + 1)
      setLoading(false)
    })
  }

  function handleSwap(dayIndex: number, newSession: DayPlan) {
    if (!plan) return
    const newDays = plan.days.map((d, i) => i === dayIndex ? newSession : d)
    setPlan({ ...plan, days: newDays })
    setSwapDayIndex(null)
  }

  async function handleCopy() {
    if (!plan) return
    await navigator.clipboard.writeText(planToText(plan))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goalLabels: Record<string, string> = {
    strength: 'Strength-biased',
    endurance: 'Endurance-biased',
    balanced: 'Balanced hybrid',
    recomp: 'Body recomp',
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Weekly planner</h1>
          <p className="text-sm text-muted mt-1">
            Configure your training week. No account required — generate, then save if you want it persisted.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-3xl">
          <PlannerForm onGenerate={handleGenerate} loading={loading} />
        </div>

        {/* Output */}
        {plan && (
          <div id="plan-output" className="mt-16 pt-8 border-t border-rule">
            {/* Plan header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-2xs font-semibold tracking-widest uppercase text-accent mb-1">
                  Generated plan
                </p>
                <h2 className="text-lg font-semibold text-ink">
                  {plan.inputs.trainingDays}-day week — {goalLabels[plan.inputs.primaryGoal]}
                </h2>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  {copied ? 'Copied' : 'Copy to clipboard'}
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Save this plan
                </button>
              </div>
            </div>

            {/* Weekly grid */}
            <WeeklyGrid plan={plan} />

            {/* Programming notes */}
            <div className="mt-8 max-w-3xl">
              <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-4">
                Programming notes
              </p>
              <div className="border border-rule bg-white p-6 space-y-4">
                {plan.programmingNotes.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-ink leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Session swap modal */}
      {plan && swapDayIndex !== null && (
        <SessionSwapModal
          plan={plan}
          dayIndex={swapDayIndex}
          onSelect={handleSwap}
          onClose={() => setSwapDayIndex(null)}
        />
      )}

      {/* Save modal */}
      {plan && showSaveModal && (
        <SavePlanModal
          plan={plan}
          user={user}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
