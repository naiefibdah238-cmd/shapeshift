'use client'

import { useState } from 'react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { calculateNutrition } from '@/lib/nutrition-logic'
import type { NutritionInputs, NutritionResult, Sex, ActivityLevel, NutritionGoal } from '@/lib/nutrition-logic'
import { useScrollReveal } from '@/hooks/useScrollReveal'

type Units = 'metric' | 'imperial'

const GOAL_LABELS: Record<NutritionGoal, string> = {
  strength:  'Build strength',
  endurance: 'Endurance performance',
  balanced:  'Balanced hybrid',
  recomp:    'Body recomp',
  lose_fat:  'Lose fat',
}

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; sub: string }> = {
  sedentary:   { label: 'Sedentary',     sub: 'Desk job, no exercise' },
  light:       { label: 'Lightly active', sub: '1–3 training days/wk' },
  moderate:    { label: 'Moderate',       sub: '3–5 training days/wk' },
  active:      { label: 'Very active',    sub: '6–7 training days/wk' },
  very_active: { label: 'Athlete',        sub: 'Daily training + physical job' },
}

function MacroBar({ label, grams, calories, total, color }: {
  label: string; grams: number; calories: number; total: number; color: string
}) {
  const pct = Math.round((calories / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink">{label}</span>
        <span className="text-xs text-muted font-mono">{grams}g · {pct}%</span>
      </div>
      <div className="h-2 bg-cream rounded-none overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const [units, setUnits] = useState<Units>('metric')
  const [inputs, setInputs] = useState<NutritionInputs>({
    weightKg: 80,
    heightCm: 178,
    age: 28,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'balanced',
    units: 'metric',
  })
  const [result, setResult] = useState<NutritionResult | null>(null)
  useScrollReveal([result])

  function set<K extends keyof NutritionInputs>(key: K, value: NutritionInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault()
    const r = calculateNutrition({ ...inputs, units })
    setResult(r)
    setTimeout(() => {
      document.getElementById('nutrition-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const weightLabel = units === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'
  const heightLabel = units === 'metric' ? 'Height (cm)' : 'Height (inches)'

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Page hero */}
      <section className="relative h-52 lg:h-64 flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1800&q=80&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-8 animate-fade-up">
          <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-2">Nutrition calculator</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Fuel your training.</h1>
          <p className="text-sm text-white/60 mt-1">TDEE, macros, and meal timing for hybrid athletes. Starting points — not prescriptions.</p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">

        <div className="max-w-2xl">
          {/* Units toggle */}
          <div className="flex items-center gap-2 mb-8 animate-fade-up delay-100">
            <span className="text-xs text-muted uppercase tracking-widest font-medium">Units</span>
            <div className="flex border border-rule">
              {(['metric', 'imperial'] as Units[]).map(u => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${units === u ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                >
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCalculate} className="space-y-7">
            {/* Body stats */}
            <div className="animate-fade-up delay-200">
              <span className="label">Body stats</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-2xs text-muted uppercase tracking-wider block mb-1.5">{weightLabel}</label>
                  <input
                    type="number"
                    value={inputs.weightKg}
                    onChange={e => set('weightKg', parseFloat(e.target.value) || 0)}
                    className="input-field"
                    min={30}
                    max={300}
                    required
                  />
                </div>
                <div>
                  <label className="text-2xs text-muted uppercase tracking-wider block mb-1.5">{heightLabel}</label>
                  <input
                    type="number"
                    value={inputs.heightCm}
                    onChange={e => set('heightCm', parseFloat(e.target.value) || 0)}
                    className="input-field"
                    min={100}
                    max={300}
                    required
                  />
                </div>
                <div>
                  <label className="text-2xs text-muted uppercase tracking-wider block mb-1.5">Age</label>
                  <input
                    type="number"
                    value={inputs.age}
                    onChange={e => set('age', parseInt(e.target.value) || 0)}
                    className="input-field"
                    min={16}
                    max={80}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sex */}
            <div className="animate-fade-up delay-300">
              <span className="label">Biological sex</span>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Sex[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('sex', s)}
                    className={`select-option text-left ${inputs.sex === s ? 'selected' : ''}`}
                  >
                    <span className="font-medium text-sm capitalize">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity level */}
            <div className="animate-fade-up delay-400">
              <span className="label">Activity level</span>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, { label: string; sub: string }][]).map(([val, info]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('activityLevel', val)}
                    className={`select-option text-left ${inputs.activityLevel === val ? 'selected' : ''}`}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{info.label}</span>
                      <span className="text-2xs opacity-70">{info.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div className="animate-fade-up delay-500">
              <span className="label">Goal</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.entries(GOAL_LABELS) as [NutritionGoal, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('goal', val)}
                    className={`select-option text-left ${inputs.goal === val ? 'selected' : ''}`}
                  >
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary text-sm px-8 py-4 w-full sm:w-auto animate-fade-up delay-600">
              Calculate targets
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div id="nutrition-result" className="mt-16 pt-8 border-t border-rule animate-fade-up">
            <p className="text-2xs font-semibold tracking-widest uppercase text-accent mb-8">Your targets</p>

            {/* Calorie overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-rule border border-rule mb-8">
              {[
                { label: 'BMR', value: result.bmr.toLocaleString(), sub: 'Base metabolic rate' },
                { label: 'TDEE', value: result.tdee.toLocaleString(), sub: 'Total daily expenditure' },
                { label: 'Target', value: result.targets.calories.toLocaleString(), sub: `Adjusted for ${GOAL_LABELS[inputs.goal].toLowerCase()}` },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="bg-white px-6 py-5 animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-1">{item.label}</p>
                  <p className="text-3xl font-bold text-ink tracking-tight">{item.value}</p>
                  <p className="text-2xs text-muted mt-1">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Macros */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="border border-rule bg-white p-6 reveal">
                <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-5">Macro breakdown</p>
                <div className="space-y-4">
                  <MacroBar label="Protein" grams={result.targets.proteinG} calories={result.targets.proteinCal} total={result.targets.calories} color="bg-ink" />
                  <MacroBar label="Carbohydrates" grams={result.targets.carbsG} calories={result.targets.carbsCal} total={result.targets.calories} color="bg-accent" />
                  <MacroBar label="Fat" grams={result.targets.fatG} calories={result.targets.fatCal} total={result.targets.calories} color="bg-rule-strong" />
                </div>

                {/* Gram summary */}
                <div className="mt-6 pt-5 border-t border-rule grid grid-cols-3 gap-4">
                  {[
                    { label: 'Protein', value: result.targets.proteinG, unit: 'g' },
                    { label: 'Carbs', value: result.targets.carbsG, unit: 'g' },
                    { label: 'Fat', value: result.targets.fatG, unit: 'g' },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <p className="text-2xl font-bold text-ink">{m.value}<span className="text-sm font-normal text-muted">{m.unit}</span></p>
                      <p className="text-2xs text-muted mt-0.5 uppercase tracking-wider">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="border border-rule bg-white p-6 reveal" style={{ transitionDelay: '100ms' }}>
                <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-5">Notes</p>
                <div className="space-y-4">
                  {result.notes.map((note, i) => (
                    <p key={i} className="text-sm text-muted leading-relaxed">{note}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Meal timing */}
            <div className="reveal">
              <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-4">Meal timing</p>
              <div className="border border-rule divide-y divide-rule">
                {result.mealTiming.map((meal, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 bg-white hover:bg-cream transition-colors">
                    <div className="col-span-12 sm:col-span-3">
                      <p className="text-sm font-medium text-ink">{meal.label}</p>
                      <p className="text-2xs text-muted font-mono mt-0.5">{meal.time}</p>
                    </div>
                    <div className="col-span-12 sm:col-span-9">
                      <p className="text-sm text-muted leading-relaxed">{meal.focus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
