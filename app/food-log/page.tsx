'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import AddFoodModal from '@/components/AddFoodModal'
import Toast from '@/components/Toast'
import { createClient } from '@/lib/supabase'
import type { FoodEntry, MealType, NutritionTarget } from '@/lib/food-log'
import { MEALS, MEAL_LABELS } from '@/lib/food-log'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/hooks/useToast'

const DEFAULT_TARGETS: NutritionTarget = { calories: 2500, protein_g: 180, carbs_g: 250, fat_g: 80 }

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function displayDate(d: Date) {
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))
  const s = formatDate(d)
  if (s === today) return 'Today'
  if (s === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function getWeekDays(reference: Date) {
  const day = reference.getDay()
  const monday = new Date(reference)
  monday.setDate(reference.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function MacroBar({ label, val, target, color }: { label: string; val: number; target: number; color: string }) {
  const pct = Math.min((val / target) * 100, 100)
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-2xs text-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-white/60">{Math.round(val)}g</span>
      </div>
      <div className="h-1 bg-white/10">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface DaySummary { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }

export default function FoodLogPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [targets, setTargets] = useState<NutritionTarget>(DEFAULT_TARGETS)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [showTargets, setShowTargets] = useState(false)
  const [streak, setStreak] = useState(0)
  const [weekData, setWeekData] = useState<DaySummary[]>([])
  const [copyMsg, setCopyMsg] = useState('')
  const { toast, showToast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  const loadEntries = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('food_log').select('*').eq('user_id', user.id)
      .eq('logged_date', formatDate(date)).order('created_at')
    setEntries(data ?? [])
  }, [user, date])

  const loadTargets = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('nutrition_targets').select('*').eq('user_id', user.id).single()
    if (data) setTargets({ calories: data.calories, protein_g: data.protein_g, carbs_g: data.carbs_g, fat_g: data.fat_g })
  }, [user])

  const loadStreak = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('food_log').select('logged_date').eq('user_id', user.id).order('logged_date', { ascending: false })
    if (!data) return
    const dates = [...new Set(data.map(e => e.logged_date))] as string[]
    if (dates.length === 0) return
    const today = formatDate(new Date())
    const yesterday = formatDate(new Date(Date.now() - 86400000))
    if (dates[0] !== today && dates[0] !== yesterday) { setStreak(0); return }
    let s = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) s++
      else break
    }
    setStreak(s)
  }, [user])

  const loadWeekData = useCallback(async () => {
    if (!user) return
    const days = getWeekDays(date)
    const from = formatDate(days[0])
    const to = formatDate(days[6])
    const { data } = await supabase.from('food_log').select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id).gte('logged_date', from).lte('logged_date', to)
    if (!data) return
    const byDate: Record<string, DaySummary> = {}
    for (const e of data) {
      if (!byDate[e.logged_date]) byDate[e.logged_date] = { date: e.logged_date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      byDate[e.logged_date].calories += e.calories
      byDate[e.logged_date].protein_g += Number(e.protein_g)
      byDate[e.logged_date].carbs_g += Number(e.carbs_g)
      byDate[e.logged_date].fat_g += Number(e.fat_g)
    }
    setWeekData(days.map(d => byDate[formatDate(d)] ?? { date: formatDate(d), calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }))
  }, [user, date])

  useEffect(() => {
    if (user) { loadEntries(); loadTargets(); loadStreak(); loadWeekData() }
  }, [user, date])

  async function handleAdd(entry: Omit<FoodEntry, 'id' | 'logged_date'>) {
    if (!user) return
    const { error } = await supabase.from('food_log').insert({ ...entry, user_id: user.id, logged_date: formatDate(date) })
    if (error) { showToast('Failed to add entry. Try again.', 'error'); return }
    setAddMeal(null)
    loadEntries()
    loadWeekData()
    loadStreak()
    showToast('Entry added')
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('food_log').delete().eq('id', id)
    if (error) { showToast('Failed to delete entry. Try again.', 'error'); return }
    loadEntries()
    loadWeekData()
  }

  async function handleCopyYesterday() {
    if (!user) return
    const yesterday = formatDate(new Date(date.getTime() - 86400000))
    const { data } = await supabase.from('food_log')
      .select('meal_type, food_name, calories, protein_g, carbs_g, fat_g, grams')
      .eq('user_id', user.id).eq('logged_date', yesterday)
    if (!data || data.length === 0) { setCopyMsg('Nothing logged yesterday.'); setTimeout(() => setCopyMsg(''), 3000); return }
    const { error } = await supabase.from('food_log').insert(data.map(e => ({ ...e, user_id: user.id, logged_date: formatDate(date) })))
    if (error) { showToast('Failed to copy meals. Try again.', 'error'); return }
    loadEntries()
    loadWeekData()
    setCopyMsg(`Copied ${data.length} item${data.length > 1 ? 's' : ''} from yesterday.`)
    setTimeout(() => setCopyMsg(''), 3000)
  }

  async function handleSaveTargets(t: NutritionTarget) {
    if (!user) return
    const { error } = await supabase.from('nutrition_targets').upsert({ user_id: user.id, ...t, updated_at: new Date().toISOString() })
    if (error) { showToast('Failed to save targets. Try again.', 'error'); return }
    setTargets(t)
    setShowTargets(false)
    showToast('Targets saved')
  }

  const totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein_g: acc.protein_g + e.protein_g, carbs_g: acc.carbs_g + e.carbs_g, fat_g: acc.fat_g + e.fat_g }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
  const remaining = targets.calories - totals.calories
  const isOver = remaining < 0
  const isToday = formatDate(date) === formatDate(new Date())

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="h-52 lg:h-64 bg-stone-900 animate-pulse" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-6">
        <div className="h-6 w-32 bg-rule rounded animate-pulse" />
        <div className="h-36 bg-rule rounded animate-pulse" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-rule rounded animate-pulse" />)}
        </div>
      </main>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <section className="relative h-52 lg:h-64 flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1800&q=80&fit=crop')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
        <div className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-8 animate-fade-up">
          <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-2">Food log</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Track your intake.</h1>
          <p className="text-sm text-white/60 mt-1">Log meals, hit your targets.</p>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Date nav */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <button onClick={() => setDate(d => new Date(d.getTime() - 86400000))} className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors px-2 py-1">
            ← <span className="hidden sm:inline">Prev</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-ink tracking-tight">{displayDate(date)}</span>
            {streak >= 2 && <span className="text-xs font-bold text-accent tracking-wide">🔥 {streak}-day streak</span>}
          </div>
          <button onClick={() => setDate(d => new Date(d.getTime() + 86400000))} disabled={isToday} className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed">
            <span className="hidden sm:inline">Next</span> →
          </button>
        </div>

        {/* Daily summary */}
        <div className="bg-ink text-white p-6 mb-8 animate-fade-up delay-100">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-2xs font-bold tracking-widest uppercase text-white/40 mb-1">Calories</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{totals.calories.toLocaleString()}</span>
                <span className="text-base text-white/40">/ {targets.calories.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xs text-white/40 uppercase tracking-wider mb-1">Remaining</p>
              <p className={`text-lg font-bold ${isOver ? 'text-red-400' : 'text-accent'}`}>
                {isOver ? '+' : ''}{Math.abs(remaining).toLocaleString()}
              </p>
              <button onClick={() => setShowTargets(true)} className="text-2xs text-white/30 hover:text-white/60 transition-colors mt-1 underline underline-offset-2">
                Edit targets
              </button>
            </div>
          </div>
          <div className="h-1.5 bg-white/10 mb-5 mt-4">
            <div className={`h-full transition-all duration-700 ${isOver ? 'bg-red-400' : 'bg-accent'}`} style={{ width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <MacroBar label="Protein" val={totals.protein_g} target={targets.protein_g} color="bg-white" />
            <MacroBar label="Carbs" val={totals.carbs_g} target={targets.carbs_g} color="bg-accent" />
            <MacroBar label="Fat" val={totals.fat_g} target={targets.fat_g} color="bg-white/50" />
          </div>
        </div>

        {/* Copy yesterday + toast */}
        {isToday && (
          <div className="flex items-center justify-between mb-6 animate-fade-up delay-200">
            <button onClick={handleCopyYesterday} className="text-xs text-muted hover:text-ink border border-rule hover:border-ink px-4 py-2 transition-all uppercase tracking-widest font-semibold">
              ↩ Copy yesterday&apos;s meals
            </button>
            {copyMsg && <span className="text-xs text-accent font-medium animate-fade-up">{copyMsg}</span>}
          </div>
        )}

        {/* Meal sections */}
        <div className="space-y-6">
          {MEALS.map((meal, i) => {
            const mealEntries = entries.filter(e => e.meal_type === meal)
            const mealCals = mealEntries.reduce((a, e) => a + e.calories, 0)
            return (
              <div key={meal} className="animate-fade-up" style={{ animationDelay: `${250 + i * 80}ms`, animationFillMode: 'both' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest uppercase text-ink">{MEAL_LABELS[meal]}</span>
                    {mealCals > 0 && <span className="text-xs text-muted font-mono">{mealCals} kcal</span>}
                  </div>
                  <button onClick={() => setAddMeal(meal)} className="text-2xs font-semibold text-muted hover:text-ink transition-colors uppercase tracking-widest border border-rule px-3 py-1.5 hover:border-ink">
                    + Add
                  </button>
                </div>
                <div className="border border-rule divide-y divide-rule">
                  {mealEntries.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-muted/60 italic bg-white">Nothing logged yet</div>
                  ) : (
                    mealEntries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-cream transition-colors group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{entry.food_name}</p>
                          {entry.grams > 0 && <p className="text-2xs text-muted font-mono mt-0.5">{entry.grams}g</p>}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-xs text-muted font-mono hidden sm:block">{entry.protein_g}p · {entry.carbs_g}c · {entry.fat_g}f</span>
                          <span className="text-sm font-semibold text-ink tabular-nums w-16 text-right">{entry.calories} kcal</span>
                          <button onClick={() => handleDelete(entry.id)} className="text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xl leading-none w-5 text-center" aria-label="Remove">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Weekly summary */}
        {weekData.length > 0 && (
          <div className="mt-12 reveal">
            <p className="text-2xs font-bold tracking-widest uppercase text-muted mb-4">This week</p>
            <div className="border border-rule divide-y divide-rule">
              <div className="grid grid-cols-5 px-4 py-2 bg-cream">
                {['Day', 'Calories', 'Protein', 'Carbs', 'Fat'].map(h => (
                  <span key={h} className="text-2xs font-semibold tracking-widest uppercase text-muted">{h}</span>
                ))}
              </div>
              {weekData.map((day, i) => {
                const isCurrentDay = day.date === formatDate(date)
                const hasData = day.calories > 0
                const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
                return (
                  <button
                    key={day.date}
                    onClick={() => setDate(new Date(day.date + 'T12:00:00'))}
                    className={`grid grid-cols-5 px-4 py-3 w-full text-left transition-colors ${isCurrentDay ? 'bg-ink text-white' : 'bg-white hover:bg-cream'}`}
                  >
                    <span className={`text-sm font-semibold ${isCurrentDay ? 'text-white' : 'text-ink'}`}>{dayName}</span>
                    <span className={`text-sm font-mono ${isCurrentDay ? 'text-white' : hasData ? 'text-ink' : 'text-muted/40'}`}>{hasData ? day.calories.toLocaleString() : '—'}</span>
                    <span className={`text-sm font-mono ${isCurrentDay ? 'text-white/70' : 'text-muted'}`}>{hasData ? `${Math.round(day.protein_g)}g` : '—'}</span>
                    <span className={`text-sm font-mono ${isCurrentDay ? 'text-white/70' : 'text-muted'}`}>{hasData ? `${Math.round(day.carbs_g)}g` : '—'}</span>
                    <span className={`text-sm font-mono ${isCurrentDay ? 'text-white/70' : 'text-muted'}`}>{hasData ? `${Math.round(day.fat_g)}g` : '—'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {addMeal && <AddFoodModal meal={addMeal} onAdd={handleAdd} onClose={() => setAddMeal(null)} />}
      {showTargets && <TargetsModal current={targets} onSave={handleSaveTargets} onClose={() => setShowTargets(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

function TargetsModal({ current, onSave, onClose }: { current: NutritionTarget; onSave: (t: NutritionTarget) => void; onClose: () => void }) {
  const [t, setT] = useState({
    calories: String(current.calories),
    protein_g: String(current.protein_g),
    carbs_g: String(current.carbs_g),
    fat_g: String(current.fat_g),
  })
  const fields: { key: keyof typeof t; label: string }[] = [
    { key: 'calories', label: 'Calories (kcal)' },
    { key: 'protein_g', label: 'Protein (g)' },
    { key: 'carbs_g', label: 'Carbs (g)' },
    { key: 'fat_g', label: 'Fat (g)' },
  ]
  function handleSave() {
    onSave({
      calories: parseInt(t.calories) || 0,
      protein_g: parseInt(t.protein_g) || 0,
      carbs_g: parseInt(t.carbs_g) || 0,
      fat_g: parseInt(t.fat_g) || 0,
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm border border-rule animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <h3 className="text-sm font-semibold text-ink">Daily targets</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                type="number"
                value={t[f.key]}
                onChange={e => setT(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="input-field"
                min={0}
              />
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button onClick={handleSave} className="btn-primary w-full text-sm py-3">Save targets</button>
        </div>
      </div>
    </div>
  )
}
