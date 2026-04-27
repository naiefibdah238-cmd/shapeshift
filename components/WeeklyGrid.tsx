'use client'

import { useState } from 'react'
import type { DayPlan, PlannerInputs, SessionType, WeeklyPlan } from '@/lib/programming-logic'
import { getSessionExercises } from '@/lib/programming-logic'

const SESSION_CLASS: Record<SessionType, string> = {
  lower_strength:     'session-lower-strength',
  upper_strength:     'session-upper-strength',
  lower_hypertrophy:  'session-lower-hypertrophy',
  upper_hypertrophy:  'session-upper-hypertrophy',
  full_body_strength: 'session-full-body-strength',
  full_body_accessory:'session-full-body-accessory',
  long_endurance:     'session-long-endurance',
  zone2_medium:       'session-zone2-medium',
  zone2_short:        'session-zone2-short',
  tempo:              'session-tempo',
  intervals:          'session-intervals',
  mobility:           'session-mobility',
  rest:               'session-rest',
}

const SESSION_BADGE: Record<SessionType, string> = {
  lower_strength:     'LOWER / STRENGTH',
  upper_strength:     'UPPER / STRENGTH',
  lower_hypertrophy:  'LOWER / HYPERTROPHY',
  upper_hypertrophy:  'UPPER / HYPERTROPHY',
  full_body_strength: 'FULL BODY / STRENGTH',
  full_body_accessory:'ACCESSORY',
  long_endurance:     'LONG ENDURANCE',
  zone2_medium:       'ZONE 2',
  zone2_short:        'ZONE 2 / SHORT',
  tempo:              'TEMPO',
  intervals:          'INTERVALS',
  mobility:           'MOBILITY',
  rest:               'REST',
}

function ExercisePanel({ sessionType, inputs }: { sessionType: SessionType; inputs: PlannerInputs }) {
  const [open, setOpen] = useState(false)
  const exercises = getSessionExercises(sessionType, inputs)
  if (exercises.length === 0) return null

  return (
    <div className="border-t border-rule">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-cream transition-colors"
      >
        <span className="text-2xs font-semibold tracking-widest uppercase text-accent">
          Full exercise list
        </span>
        <span className="text-xs text-accent font-mono">{open ? '−' : '+'}</span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 pb-3 space-y-1">
          {exercises.map((ex, i) => {
            const detail = ex.sets === '1' ? ex.reps : `${ex.sets} × ${ex.reps}`
            return (
              <div key={i} className="flex items-start gap-2 py-1 border-t border-rule/40 first:border-t-0">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-ink">{ex.name}</span>
                  {ex.note && (
                    <span className="block text-2xs text-muted/70 mt-0.5">{ex.note}</span>
                  )}
                </div>
                <span className="text-xs text-muted font-mono shrink-0">{detail}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayCell({
  day,
  inputs,
  onSwap,
  swappable = false,
}: {
  day: DayPlan
  inputs: PlannerInputs
  onSwap?: (dayIndex: number) => void
  swappable?: boolean
}) {
  const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day.day)
  const isRest = day.sessionType === 'rest'

  return (
    <div
      className={`
        relative flex flex-col min-h-[160px] border-b border-r border-rule bg-white
        ${SESSION_CLASS[day.sessionType]}
        ${swappable && !isRest ? 'cursor-pointer hover:bg-cream transition-colors group' : ''}
      `}
      onClick={swappable && !isRest ? () => onSwap?.(dayIndex) : undefined}
    >
      {/* Day label */}
      <div className="px-3 pt-2 pb-1 border-b border-rule">
        <span className="text-2xs font-semibold tracking-widest uppercase text-muted">
          {day.day.slice(0, 3)}
        </span>
      </div>

      {/* Session content */}
      <div className="px-3 py-3 flex flex-col gap-2 flex-1">
        {/* Badge */}
        <span className="text-2xs font-semibold tracking-wider uppercase text-muted/70">
          {SESSION_BADGE[day.sessionType]}
        </span>

        {/* Session name */}
        <p className={`text-sm font-medium leading-snug ${isRest ? 'text-muted' : 'text-ink'}`}>
          {day.sessionName}
        </p>

        {/* Duration */}
        {!isRest && (
          <span className="text-2xs text-muted font-mono">
            {day.estimatedDuration}
          </span>
        )}

        {/* Rationale */}
        {!isRest && (
          <p className="text-2xs text-muted/80 leading-relaxed mt-auto pt-2 border-t border-rule/50">
            {day.rationale}
          </p>
        )}
      </div>

      {/* Exercise panel */}
      {!isRest && <ExercisePanel sessionType={day.sessionType} inputs={inputs} />}

      {/* Swap hint for interactive mode */}
      {swappable && !isRest && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-2xs text-muted border border-rule px-1.5 py-0.5 bg-paper">
            swap
          </span>
        </div>
      )}
    </div>
  )
}

interface Props {
  plan: WeeklyPlan
  onSwap?: (dayIndex: number) => void
  swappable?: boolean
}

export default function WeeklyGrid({ plan, onSwap, swappable = false }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop: 7-column grid */}
      <div className="hidden lg:grid lg:grid-cols-7 border-t border-l border-rule min-w-[900px]">
        {plan.days.map((day, i) => (
          <div
            key={i}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 55}ms`, animationFillMode: 'both' }}
          >
            <DayCell day={day} inputs={plan.inputs} onSwap={onSwap} swappable={swappable} />
          </div>
        ))}
      </div>

      {/* Mobile: stacked list */}
      <div className="lg:hidden divide-y divide-rule border border-rule">
        {plan.days.map((day, i) => (
          <div
            key={i}
            className={`animate-fade-up ${SESSION_CLASS[day.sessionType]}`}
            style={{ animationDelay: `${i * 55}ms`, animationFillMode: 'both' }}
          >
            {/* Main row */}
            <div className="flex gap-0">
              {/* Left: day + badge */}
              <div className="w-20 flex-shrink-0 px-3 py-4 flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {day.day.slice(0, 3)}
                </span>
                <span className="text-2xs text-muted/60 uppercase tracking-wider leading-tight">
                  {SESSION_BADGE[day.sessionType]}
                </span>
              </div>

              {/* Right: session info */}
              <div
                className={`flex-1 px-3 py-4 border-l border-rule bg-white ${swappable && day.sessionType !== 'rest' ? 'cursor-pointer active:bg-cream' : ''}`}
                onClick={swappable && day.sessionType !== 'rest' ? () => onSwap?.(i) : undefined}
              >
                <p className={`text-sm font-medium leading-snug ${day.sessionType === 'rest' ? 'text-muted' : 'text-ink'}`}>
                  {day.sessionName}
                </p>
                {day.sessionType !== 'rest' && (
                  <>
                    <p className="text-2xs font-mono text-muted mt-1">{day.estimatedDuration}</p>
                    <p className="text-2xs text-muted/80 mt-2 leading-relaxed">{day.rationale}</p>
                  </>
                )}
              </div>
            </div>

            {/* Exercise panel */}
            {day.sessionType !== 'rest' && (
              <div className="border-t border-rule bg-white">
                <ExercisePanel sessionType={day.sessionType} inputs={plan.inputs} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
