'use client'

import { useState, useEffect } from 'react'
import type { MealType, FoodSearchResult } from '@/lib/food-log'
import { MEAL_LABELS } from '@/lib/food-log'

interface AddEntry {
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  grams: number
  meal_type: MealType
}

interface Props {
  meal: MealType
  onAdd: (entry: AddEntry) => void
  onClose: () => void
}

type MeasureMode = 'grams' | 'servings'

const RECENT_KEY = 'ss_recent_foods'
const MAX_RECENT = 8

interface RecentFood {
  name: string
  per100g: { calories: number; protein: number; carbs: number; fat: number }
  servingGrams: number | null
  householdServing: string | null
  lastGrams: number
}

function loadRecent(): RecentFood[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

function saveRecent(food: RecentFood) {
  const existing = loadRecent().filter(f => f.name !== food.name)
  localStorage.setItem(RECENT_KEY, JSON.stringify([food, ...existing].slice(0, MAX_RECENT)))
}

export default function AddFoodModal({ meal, onAdd, onClose }: Props) {
  const [tab, setTab] = useState<'search' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const [measureMode, setMeasureMode] = useState<MeasureMode>('grams')
  const [grams, setGrams] = useState(100)
  const [servings, setServings] = useState(1)
  const [gramsPerServing, setGramsPerServing] = useState(100)
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([])

  useEffect(() => { setRecentFoods(loadRecent()) }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        const data = await res.json()
        setResults(data.results ?? [])
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') setResults([])
      }
      setSearching(false)
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function selectFood(food: FoodSearchResult) {
    setSelected(food)
    setResults([])
    if (food.servingGrams) {
      setMeasureMode('servings')
      setGramsPerServing(food.servingGrams)
      setServings(1)
    } else {
      setMeasureMode('grams')
      setGrams(100)
    }
  }

  const totalGrams = measureMode === 'servings' ? servings * gramsPerServing : grams

  const preview = selected ? {
    calories: Math.round(selected.per100g.calories * totalGrams / 100),
    protein: Math.round(selected.per100g.protein * totalGrams / 100 * 10) / 10,
    carbs: Math.round(selected.per100g.carbs * totalGrams / 100 * 10) / 10,
    fat: Math.round(selected.per100g.fat * totalGrams / 100 * 10) / 10,
  } : null

  const canAdd = tab === 'search'
    ? selected !== null && totalGrams > 0
    : manual.name.trim() !== '' && manual.calories !== ''

  function handleAdd() {
    if (tab === 'search' && selected && preview) {
      const name = measureMode === 'servings' ? `${selected.name} ×${servings}` : selected.name
      saveRecent({ name: selected.name, per100g: selected.per100g, servingGrams: selected.servingGrams, householdServing: selected.householdServing, lastGrams: Math.round(totalGrams) })
      onAdd({ food_name: name, calories: preview.calories, protein_g: preview.protein, carbs_g: preview.carbs, fat_g: preview.fat, grams: Math.round(totalGrams), meal_type: meal })
    } else if (tab === 'manual' && manual.name) {
      onAdd({ food_name: manual.name, calories: parseInt(manual.calories) || 0, protein_g: parseFloat(manual.protein) || 0, carbs_g: parseFloat(manual.carbs) || 0, fat_g: parseFloat(manual.fat) || 0, grams: 0, meal_type: meal })
    }
  }

  function selectRecent(r: RecentFood) {
    const asFoodResult: FoodSearchResult = { id: r.name, name: r.name, per100g: r.per100g, servingGrams: r.servingGrams, householdServing: r.householdServing }
    selectFood(asFoodResult)
    if (r.servingGrams) {
      setServings(Math.round((r.lastGrams / r.servingGrams) * 10) / 10 || 1)
    } else {
      setGrams(r.lastGrams)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg border-t sm:border border-rule max-h-[90vh] flex flex-col animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule flex-shrink-0">
          <h3 className="text-sm font-semibold text-ink">Add to {MEAL_LABELS[meal]}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none">×</button>
        </div>

        <div className="flex border-b border-rule flex-shrink-0">
          {(['search', 'manual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${tab === t ? 'text-ink border-b-2 border-ink -mb-px bg-cream' : 'text-muted hover:text-ink'}`}
            >
              {t === 'search' ? 'Search' : 'Manual entry'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {tab === 'search' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="e.g. eggs, chicken breast, oats..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                className="input-field"
                autoFocus
              />

              {searching && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>Searching USDA database...</span>
                </div>
              )}

              {/* Recent foods */}
              {!selected && !searching && query.length < 2 && recentFoods.length > 0 && (
                <div>
                  <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-2">Recent</p>
                  <div className="border border-rule divide-y divide-rule">
                    {recentFoods.map(r => (
                      <button
                        key={r.name}
                        onClick={() => selectRecent(r)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cream transition-colors"
                      >
                        <span className="text-sm text-ink pr-4 leading-snug">{r.name}</span>
                        <span className="text-xs text-muted font-mono flex-shrink-0">{r.per100g.calories} kcal/100g</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!selected && !searching && results.length > 0 && (
                <div className="border border-rule divide-y divide-rule">
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => selectFood(r)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cream transition-colors"
                    >
                      <span className="text-sm text-ink pr-4 leading-snug">{r.name}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted font-mono">{r.per100g.calories} kcal/100g</p>
                        {r.householdServing && r.servingGrams && (
                          <p className="text-2xs text-accent mt-0.5">{r.householdServing} = {r.servingGrams}g</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!selected && !searching && query.length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted">No results. Try a different name or use manual entry.</p>
              )}

              {selected && (
                <div className="space-y-4 animate-fade-up">
                  <div className="flex items-start justify-between gap-3 p-4 border border-rule bg-cream">
                    <div>
                      <p className="text-sm font-semibold text-ink leading-snug">{selected.name}</p>
                      <p className="text-2xs text-muted mt-1 font-mono">
                        {selected.per100g.calories} kcal · {selected.per100g.protein}g P · {selected.per100g.carbs}g C · {selected.per100g.fat}g F <span className="opacity-60">per 100g</span>
                      </p>
                    </div>
                    <button onClick={() => { setSelected(null); setQuery('') }} className="text-2xs text-muted hover:text-ink flex-shrink-0 underline underline-offset-2">Change</button>
                  </div>

                  {/* Measure mode toggle */}
                  <div>
                    <div className="flex border border-rule mb-3">
                      <button
                        onClick={() => setMeasureMode('grams')}
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${measureMode === 'grams' ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                      >
                        By weight (g)
                      </button>
                      <button
                        onClick={() => setMeasureMode('servings')}
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${measureMode === 'servings' ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                      >
                        By unit / serving
                      </button>
                    </div>

                    {measureMode === 'grams' ? (
                      <div>
                        <label className="label">Amount (grams)</label>
                        <input
                          type="number"
                          value={grams}
                          onChange={e => setGrams(parseFloat(e.target.value) || 0)}
                          className="input-field"
                          min={1}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Quantity</label>
                            <input
                              type="number"
                              value={servings}
                              onChange={e => setServings(parseFloat(e.target.value) || 0)}
                              className="input-field"
                              min={0.5}
                              step={0.5}
                            />
                          </div>
                          <div>
                            <label className="label">Grams per unit</label>
                            <input
                              type="number"
                              value={gramsPerServing}
                              onChange={e => setGramsPerServing(parseFloat(e.target.value) || 0)}
                              className="input-field"
                              min={1}
                            />
                          </div>
                        </div>
                        {selected.householdServing && selected.servingGrams && (
                          <p className="text-2xs text-accent">
                            USDA serving: {selected.householdServing} = {selected.servingGrams}g
                          </p>
                        )}
                        <p className="text-2xs text-muted">Total: {Math.round(totalGrams)}g</p>
                      </div>
                    )}
                  </div>

                  {preview && (
                    <div className="grid grid-cols-4 gap-px bg-rule border border-rule">
                      {[
                        { label: 'Calories', value: preview.calories, unit: 'kcal' },
                        { label: 'Protein', value: preview.protein, unit: 'g' },
                        { label: 'Carbs', value: preview.carbs, unit: 'g' },
                        { label: 'Fat', value: preview.fat, unit: 'g' },
                      ].map(m => (
                        <div key={m.label} className="bg-white px-3 py-3 text-center">
                          <p className="text-lg font-bold text-ink leading-none">{m.value}<span className="text-2xs font-normal text-muted">{m.unit}</span></p>
                          <p className="text-2xs text-muted uppercase tracking-wider mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Food name</label>
                <input type="text" placeholder="e.g. 2 scrambled eggs" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} className="input-field" autoFocus />
              </div>
              <div>
                <label className="label">Calories (kcal)</label>
                <input type="number" placeholder="0" value={manual.calories} onChange={e => setManual(p => ({ ...p, calories: e.target.value }))} className="input-field" min={0} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Protein (g)</label>
                  <input type="number" placeholder="0" value={manual.protein} onChange={e => setManual(p => ({ ...p, protein: e.target.value }))} className="input-field" min={0} />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input type="number" placeholder="0" value={manual.carbs} onChange={e => setManual(p => ({ ...p, carbs: e.target.value }))} className="input-field" min={0} />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input type="number" placeholder="0" value={manual.fat} onChange={e => setManual(p => ({ ...p, fat: e.target.value }))} className="input-field" min={0} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-rule flex-shrink-0">
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="btn-primary w-full text-sm py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to {MEAL_LABELS[meal]}
          </button>
        </div>
      </div>
    </div>
  )
}
