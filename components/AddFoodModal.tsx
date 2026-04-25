'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function AddFoodModal({ meal, onAdd, onClose }: Props) {
  const [tab, setTab] = useState<'search' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const [grams, setGrams] = useState(100)
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } catch { setResults([]) }
      setSearching(false)
    }, 400)
  }, [query])

  const preview = selected ? {
    calories: Math.round(selected.per100g.calories * grams / 100),
    protein: Math.round(selected.per100g.protein * grams / 100 * 10) / 10,
    carbs: Math.round(selected.per100g.carbs * grams / 100 * 10) / 10,
    fat: Math.round(selected.per100g.fat * grams / 100 * 10) / 10,
  } : null

  const canAdd = tab === 'search'
    ? (selected !== null && grams > 0)
    : manual.name.trim() !== '' && manual.calories !== ''

  function handleAdd() {
    if (tab === 'search' && selected && preview) {
      onAdd({ food_name: selected.name, calories: preview.calories, protein_g: preview.protein, carbs_g: preview.carbs, fat_g: preview.fat, grams, meal_type: meal })
    } else if (tab === 'manual' && manual.name) {
      onAdd({ food_name: manual.name, calories: parseInt(manual.calories) || 0, protein_g: parseFloat(manual.protein) || 0, carbs_g: parseFloat(manual.carbs) || 0, fat_g: parseFloat(manual.fat) || 0, grams: 0, meal_type: meal })
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
                placeholder="e.g. chicken breast, brown rice..."
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

              {!selected && !searching && results.length > 0 && (
                <div className="border border-rule divide-y divide-rule">
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelected(r); setResults([]) }}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cream transition-colors group"
                    >
                      <span className="text-sm text-ink pr-4 leading-snug">{r.name}</span>
                      <span className="text-xs text-muted font-mono flex-shrink-0">{r.per100g.calories} kcal/100g</span>
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
                        {selected.per100g.calories} kcal · {selected.per100g.protein}g P · {selected.per100g.carbs}g C · {selected.per100g.fat}g F <span className="text-muted/60">per 100g</span>
                      </p>
                    </div>
                    <button onClick={() => { setSelected(null); setQuery('') }} className="text-2xs text-muted hover:text-ink flex-shrink-0 underline underline-offset-2">Change</button>
                  </div>

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
                <input type="text" placeholder="e.g. Grilled chicken breast" value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} className="input-field" autoFocus />
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
