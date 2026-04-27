'use client'

import { useEffect, useRef } from 'react'
import type { DayPlan, WeeklyPlan } from '@/lib/programming-logic'
import { getValidSwapsForDay } from '@/lib/programming-logic'

interface Props {
  plan: WeeklyPlan
  dayIndex: number
  onSelect: (dayIndex: number, newSession: DayPlan) => void
  onClose: () => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SessionSwapModal({ plan, dayIndex, onSelect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const currentDay = plan.days[dayIndex]
  const swapOptions = getValidSwapsForDay(plan, dayIndex)

  const titleId = 'swap-modal-title'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full sm:max-w-lg bg-paper border border-rule shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
          <div>
            <p className="text-2xs font-semibold tracking-widest uppercase text-muted">{DAYS[dayIndex]}</p>
            <p id={titleId} className="text-sm font-medium text-ink mt-0.5">Swap session</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current session */}
        <div className="px-6 py-4 border-b border-rule bg-cream">
          <p className="text-2xs text-muted uppercase tracking-wider mb-1">Current</p>
          <p className="text-sm font-medium text-ink">{currentDay.sessionName}</p>
          <p className="text-2xs text-muted font-mono mt-0.5">{currentDay.estimatedDuration}</p>
        </div>

        {/* Options */}
        <div className="px-6 py-4">
          <p className="text-2xs text-muted uppercase tracking-wider mb-3">
            {swapOptions.length > 0 ? 'Valid alternatives' : 'No valid alternatives for this slot'}
          </p>

          <div className="divide-y divide-rule border border-rule">
            {swapOptions.map((option, i) => (
              <button
                key={i}
                onClick={() => onSelect(dayIndex, option)}
                className="w-full text-left px-4 py-3 hover:bg-cream transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                      {option.sessionName}
                    </p>
                    <p className="text-2xs text-muted mt-0.5 leading-relaxed">{option.rationale}</p>
                  </div>
                  <span className="text-2xs font-mono text-muted flex-shrink-0 pt-0.5">
                    {option.estimatedDuration}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {swapOptions.length === 0 && (
            <p className="text-sm text-muted py-2">
              The adjacent sessions constrain this slot too tightly for a meaningful swap. Try regenerating for a different arrangement.
            </p>
          )}
        </div>

        <div className="px-6 pb-4">
          <button onClick={onClose} className="btn-ghost text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
