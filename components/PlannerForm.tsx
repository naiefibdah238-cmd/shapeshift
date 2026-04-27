'use client'

import { useState } from 'react'
import type { PlannerInputs, PrimaryGoal, LiftingStyle, EnduranceFocus, EnduranceVolume, RecoveryPriority } from '@/lib/programming-logic'

interface Props {
  onGenerate: (inputs: PlannerInputs) => void
  loading: boolean
}

type OptionGroup<T extends string> = { value: T; label: string; sub?: string }[]

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  cols = 2,
}: {
  label: string
  options: OptionGroup<T>
  value: T
  onChange: (v: T) => void
  cols?: number
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className={`grid gap-2 ${cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`select-option text-left ${value === opt.value ? 'selected' : ''}`}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-sm leading-tight">{opt.label}</span>
              {opt.sub && <span className="text-2xs opacity-70 leading-tight">{opt.sub}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PlannerForm({ onGenerate, loading }: Props) {
  const [inputs, setInputs] = useState<PlannerInputs>({
    primaryGoal: 'balanced',
    trainingDays: 5,
    liftingStyle: 'powerbuilding',
    enduranceFocus: 'running',
    enduranceVolume: 'moderate',
    includeMobility: false,
    recoveryPriority: 'average',
    isDeload: false,
  })

  function set<K extends keyof PlannerInputs>(key: K, value: PlannerInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onGenerate(inputs) }}
      className="space-y-8"
    >
      <div className="animate-fade-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
        <OptionPicker<PrimaryGoal>
          label="Primary goal"
          cols={4}
          value={inputs.primaryGoal}
          onChange={v => set('primaryGoal', v)}
          options={[
            { value: 'strength',  label: 'Strength-biased',   sub: 'Lifting leads, cardio supports' },
            { value: 'endurance', label: 'Endurance-biased',  sub: 'Cardio leads, lifting supports' },
            { value: 'balanced',  label: 'Balanced hybrid',   sub: 'Equal emphasis' },
            { value: 'recomp',    label: 'Body recomp',       sub: 'Lifting + metabolic work' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
        <OptionPicker<'4' | '5' | '6'>
          label="Training days per week"
          cols={3}
          value={inputs.trainingDays.toString() as '4' | '5' | '6'}
          onChange={v => set('trainingDays', parseInt(v) as 4 | 5 | 6)}
          options={[
            { value: '4', label: '4 days', sub: '3 rest days' },
            { value: '5', label: '5 days', sub: '2 rest days' },
            { value: '6', label: '6 days', sub: '1 rest day' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
        <OptionPicker<LiftingStyle>
          label="Lifting style"
          cols={4}
          value={inputs.liftingStyle}
          onChange={v => set('liftingStyle', v)}
          options={[
            { value: 'powerbuilding', label: 'Powerbuilding',      sub: 'Strength + hypertrophy' },
            { value: 'strength',      label: 'Pure strength',      sub: 'Low volume, heavy' },
            { value: 'bodybuilding',  label: 'Bodybuilding',       sub: 'Higher volume, hypertrophy' },
            { value: 'functional',    label: 'Functional',         sub: 'Athletic, full-body focus' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
        <OptionPicker<EnduranceFocus>
          label="Endurance focus"
          cols={4}
          value={inputs.enduranceFocus}
          onChange={v => set('enduranceFocus', v)}
          options={[
            { value: 'running', label: 'Running' },
            { value: 'cycling', label: 'Cycling' },
            { value: 'rowing',  label: 'Rowing' },
            { value: 'mixed',   label: 'Mixed' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '320ms', animationFillMode: 'both' }}>
        <OptionPicker<EnduranceVolume>
          label="Weekly endurance volume"
          cols={3}
          value={inputs.enduranceVolume}
          onChange={v => set('enduranceVolume', v)}
          options={[
            { value: 'low',      label: 'Low',      sub: '1–2 sessions' },
            { value: 'moderate', label: 'Moderate', sub: '3 sessions' },
            { value: 'high',     label: 'High',     sub: '4+ sessions' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
        <span className="label">Include mobility / pilates day?</span>
        <div className="grid grid-cols-2 gap-2">
          {([true, false] as const).map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => set('includeMobility', val)}
              className={`select-option text-left ${inputs.includeMobility === val ? 'selected' : ''}`}
            >
              <span className="font-medium text-sm">{val ? 'Yes' : 'No'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '480ms', animationFillMode: 'both' }}>
        <OptionPicker<RecoveryPriority>
          label="Recovery capacity"
          cols={3}
          value={inputs.recoveryPriority}
          onChange={v => set('recoveryPriority', v)}
          options={[
            { value: 'good',    label: 'I recover well',    sub: 'Sleep, food, low stress' },
            { value: 'average', label: 'Average',           sub: 'Standard lifestyle' },
            { value: 'careful', label: 'Needs sequencing',  sub: 'High life stress, limited sleep' },
          ]}
        />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '480ms', animationFillMode: 'both' }}>
        <span className="label">Is this a deload week?</span>
        <div className="grid grid-cols-2 gap-2">
          {([false, true] as const).map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => set('isDeload', val)}
              className={`select-option text-left ${inputs.isDeload === val ? 'selected' : ''}`}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{val ? 'Yes — deload' : 'No — full week'}</span>
                <span className="text-2xs opacity-70">{val ? '40% volume, same structure' : 'Normal training week'}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 animate-fade-up" style={{ animationDelay: '560ms', animationFillMode: 'both' }}>
        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto text-sm py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden">
          <span className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
            Generate plan
          </span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </button>
      </div>
    </form>
  )
}
