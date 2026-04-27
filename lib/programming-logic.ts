// =============================================================================
// SPLIT — Hybrid Training Week Planner
// Core programming logic: constraint-based session placement
// =============================================================================

export type PrimaryGoal = 'strength' | 'endurance' | 'balanced' | 'recomp'
export type LiftingStyle = 'powerbuilding' | 'strength' | 'bodybuilding' | 'functional'
export type EnduranceFocus = 'running' | 'cycling' | 'rowing' | 'mixed'
export type EnduranceVolume = 'low' | 'moderate' | 'high'
export type RecoveryPriority = 'good' | 'average' | 'careful'

export interface PlannerInputs {
  primaryGoal: PrimaryGoal
  trainingDays: 4 | 5 | 6
  liftingStyle: LiftingStyle
  enduranceFocus: EnduranceFocus
  enduranceVolume: EnduranceVolume
  includeMobility: boolean
  recoveryPriority: RecoveryPriority
  isDeload?: boolean
}

export type SessionType =
  | 'lower_strength'
  | 'upper_strength'
  | 'lower_hypertrophy'
  | 'upper_hypertrophy'
  | 'full_body_strength'
  | 'full_body_accessory'
  | 'long_endurance'
  | 'zone2_medium'
  | 'zone2_short'
  | 'tempo'
  | 'intervals'
  | 'mobility'
  | 'rest'

export interface DayPlan {
  day: string
  sessionType: SessionType
  sessionName: string
  estimatedDuration: string
  rationale: string
}

export interface WeeklyPlan {
  days: DayPlan[]
  programmingNotes: string
  inputs: PlannerInputs
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

// ---------------------------------------------------------------------------
// Session metadata
// ---------------------------------------------------------------------------

interface SessionProps {
  isCNSIntensive: boolean
  isHardEndurance: boolean     // causes leg fatigue → never the day before lower-body lift
  isLowerBodyIntensive: boolean
  isHeavyLift: boolean
  isLiftSession: boolean
  isEnduranceSession: boolean
}

const SESSION_PROPS: Record<SessionType, SessionProps> = {
  lower_strength:     { isCNSIntensive: true,  isHardEndurance: false, isLowerBodyIntensive: true,  isHeavyLift: true,  isLiftSession: true,  isEnduranceSession: false },
  upper_strength:     { isCNSIntensive: true,  isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: true,  isLiftSession: true,  isEnduranceSession: false },
  lower_hypertrophy:  { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: true,  isHeavyLift: false, isLiftSession: true,  isEnduranceSession: false },
  upper_hypertrophy:  { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: true,  isEnduranceSession: false },
  full_body_strength: { isCNSIntensive: true,  isHardEndurance: false, isLowerBodyIntensive: true,  isHeavyLift: true,  isLiftSession: true,  isEnduranceSession: false },
  full_body_accessory:{ isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: true,  isEnduranceSession: false },
  long_endurance:     { isCNSIntensive: false, isHardEndurance: true,  isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: true  },
  zone2_medium:       { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: true  },
  zone2_short:        { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: true  },
  tempo:              { isCNSIntensive: true,  isHardEndurance: true,  isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: true  },
  intervals:          { isCNSIntensive: true,  isHardEndurance: true,  isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: true  },
  mobility:           { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: false },
  rest:               { isCNSIntensive: false, isHardEndurance: false, isLowerBodyIntensive: false, isHeavyLift: false, isLiftSession: false, isEnduranceSession: false },
}

// ---------------------------------------------------------------------------
// Session display names
// ---------------------------------------------------------------------------

const ENDURANCE_NAMES: Record<EnduranceFocus, Record<string, string>> = {
  running: {
    long_endurance: 'Long run — easy pace',
    zone2_medium:   'Zone 2 run',
    zone2_short:    'Easy recovery run',
    tempo:          'Tempo run — threshold',
    intervals:      'Track intervals — VO2max',
  },
  cycling: {
    long_endurance: 'Long ride — easy pace',
    zone2_medium:   'Zone 2 ride',
    zone2_short:    'Recovery spin',
    tempo:          'Tempo ride — threshold',
    intervals:      'VO2max intervals',
  },
  rowing: {
    long_endurance: 'Long erg — steady state',
    zone2_medium:   'Zone 2 row',
    zone2_short:    'Easy row',
    tempo:          'Threshold row',
    intervals:      'Power intervals',
  },
  mixed: {
    long_endurance: 'Long aerobic session',
    zone2_medium:   'Zone 2 session',
    zone2_short:    'Easy aerobic work',
    tempo:          'Threshold session',
    intervals:      'High-intensity intervals',
  },
}

const LIFT_NAMES: Record<LiftingStyle, Record<string, string>> = {
  strength: {
    lower_strength:      'Lower body — heavy compounds',
    upper_strength:      'Upper body — heavy compounds',
    lower_hypertrophy:   'Lower body — accessory volume',
    upper_hypertrophy:   'Upper body — accessory volume',
    full_body_strength:  'Full body — heavy',
    full_body_accessory: 'GPP / accessory work',
  },
  powerbuilding: {
    lower_strength:      'Lower body — squat & deadlift',
    upper_strength:      'Upper body — press & pull',
    lower_hypertrophy:   'Lower body — hypertrophy',
    upper_hypertrophy:   'Upper body — hypertrophy',
    full_body_strength:  'Full body — compound strength',
    full_body_accessory: 'Full body — accessory',
  },
  bodybuilding: {
    lower_strength:      'Legs — strength base',
    upper_strength:      'Upper — strength base',
    lower_hypertrophy:   'Legs — volume',
    upper_hypertrophy:   'Upper — volume',
    full_body_strength:  'Full body — strength',
    full_body_accessory: 'Full body — volume',
  },
  functional: {
    lower_strength:      'Lower body — heavy functional',
    upper_strength:      'Upper body — heavy functional',
    lower_hypertrophy:   'Lower body — functional volume',
    upper_hypertrophy:   'Upper body — functional volume',
    full_body_strength:  'Full body — heavy functional',
    full_body_accessory: 'Functional training',
  },
}

function getSessionName(type: SessionType, inputs: PlannerInputs): string {
  if (type === 'mobility') return 'Mobility / pilates'
  if (type === 'rest') return 'Rest'
  if (SESSION_PROPS[type].isEnduranceSession) return ENDURANCE_NAMES[inputs.enduranceFocus][type] ?? type
  return LIFT_NAMES[inputs.liftingStyle][type] ?? type
}

function getSessionDuration(type: SessionType, inputs: PlannerInputs): string {
  const isEndurance = inputs.primaryGoal === 'endurance'
  const map: Record<SessionType, string> = {
    lower_strength:     '75–90 min',
    upper_strength:     '60–75 min',
    lower_hypertrophy:  '60–75 min',
    upper_hypertrophy:  '60–75 min',
    full_body_strength: '75–90 min',
    full_body_accessory:'45–60 min',
    long_endurance:     isEndurance ? '90–120 min' : '60–90 min',
    zone2_medium:       '45–60 min',
    zone2_short:        '30–40 min',
    tempo:              '45–60 min',
    intervals:          '45–55 min',
    mobility:           '45–60 min',
    rest:               '—',
  }
  return map[type]
}

// ---------------------------------------------------------------------------
// Step 1: Determine how many sessions of each kind to include
// ---------------------------------------------------------------------------

interface SessionCounts {
  liftingCount: number
  enduranceCount: number
  mobilityCount: number
}

function computeSessionCounts(inputs: PlannerInputs): SessionCounts {
  const { trainingDays, enduranceVolume, primaryGoal, includeMobility } = inputs
  const mobilityCount = includeMobility ? 1 : 0
  const available = trainingDays - mobilityCount

  const desiredEndurance = { low: 2, moderate: 3, high: 4 }[enduranceVolume]

  // Minimum lifting sessions based on goal — we don't let lifting drop below this
  const minLifting = {
    strength:  Math.min(3, Math.max(2, available - 2)),
    endurance: Math.min(2, Math.max(1, available - 3)),
    balanced:  Math.max(2, Math.floor(available / 2)),
    recomp:    Math.min(3, Math.max(2, available - 2)),
  }[primaryGoal]

  const enduranceCount = Math.min(desiredEndurance, Math.max(1, available - minLifting))
  const liftingCount = available - enduranceCount

  return { liftingCount, enduranceCount, mobilityCount }
}

// ---------------------------------------------------------------------------
// Step 2: Build the list of specific sessions to place
// ---------------------------------------------------------------------------

function buildLiftingSessions(style: LiftingStyle, count: number, goal: PrimaryGoal): SessionType[] {
  // Returns sessions ordered heaviest-first (most constrained placed first)
  const tables: Record<LiftingStyle, Record<number, SessionType[]>> = {
    strength: {
      2: ['lower_strength', 'upper_strength'],
      3: ['lower_strength', 'upper_strength', 'lower_strength'],
      4: ['lower_strength', 'upper_strength', 'lower_strength', 'upper_strength'],
      5: ['lower_strength', 'upper_strength', 'lower_strength', 'upper_strength', 'full_body_accessory'],
    },
    powerbuilding: {
      2: ['lower_strength', 'upper_strength'],
      3: ['lower_strength', 'upper_strength', 'lower_hypertrophy'],
      4: ['lower_strength', 'upper_strength', 'lower_hypertrophy', 'upper_hypertrophy'],
      5: ['lower_strength', 'upper_strength', 'lower_hypertrophy', 'upper_hypertrophy', 'full_body_accessory'],
    },
    bodybuilding: {
      2: ['lower_hypertrophy', 'upper_hypertrophy'],
      3: ['lower_hypertrophy', 'upper_hypertrophy', 'full_body_accessory'],
      4: ['lower_hypertrophy', 'upper_hypertrophy', 'lower_hypertrophy', 'upper_hypertrophy'],
      5: ['lower_hypertrophy', 'upper_hypertrophy', 'lower_hypertrophy', 'upper_hypertrophy', 'full_body_accessory'],
    },
    functional: {
      2: ['full_body_strength', 'full_body_accessory'],
      3: ['full_body_strength', 'lower_strength', 'upper_strength'],
      4: ['full_body_strength', 'lower_strength', 'upper_strength', 'full_body_accessory'],
      5: ['full_body_strength', 'lower_strength', 'upper_strength', 'lower_hypertrophy', 'full_body_accessory'],
    },
  }

  const row = tables[style][count] ?? tables[style][Math.min(count, 5)] ?? tables[style][2]
  return row.slice(0, count)
}

function buildEnduranceSessions(
  count: number,
  goal: PrimaryGoal,
  volume: EnduranceVolume,
): SessionType[] {
  // Include hard quality work only when endurance is a priority
  const wantQuality = goal === 'endurance' || (goal === 'balanced' && volume === 'high')

  const templates: Record<number, { quality: SessionType[]; base: SessionType[] }> = {
    1: { quality: ['long_endurance'],                                base: ['long_endurance'] },
    2: { quality: ['long_endurance', 'tempo'],                       base: ['long_endurance', 'zone2_medium'] },
    3: { quality: ['long_endurance', 'tempo', 'zone2_medium'],       base: ['long_endurance', 'zone2_medium', 'zone2_short'] },
    4: { quality: ['long_endurance', 'tempo', 'zone2_medium', 'zone2_short'], base: ['long_endurance', 'zone2_medium', 'zone2_medium', 'zone2_short'] },
  }

  const template = templates[count] ?? templates[Math.min(count, 4)]
  return (wantQuality ? template.quality : template.base).slice(0, count)
}

// ---------------------------------------------------------------------------
// Step 3: Constraint checking
// ---------------------------------------------------------------------------

// For cyclic week use, Sunday's effective "next day" is Monday (day 0)
function effectiveNext(dayIndex: number, schedule: (SessionType | null)[]): SessionType | null {
  if (dayIndex === 6) return schedule[0]
  return schedule[dayIndex + 1] ?? null
}

function effectivePrev(dayIndex: number, schedule: (SessionType | null)[]): SessionType | null {
  if (dayIndex === 0) return schedule[6]  // treat Monday's prior day as Sunday (cyclic)
  return schedule[dayIndex - 1] ?? null
}

function hardConstraintSatisfied(
  session: SessionType,
  slot: number,
  schedule: (SessionType | null)[],
  recovery: RecoveryPriority,
): boolean {
  const props = SESSION_PROPS[session]
  const prev = effectivePrev(slot, schedule)
  const next = effectiveNext(slot, schedule)
  const prevProps = prev ? SESSION_PROPS[prev] : null
  const nextProps = next ? SESSION_PROPS[next] : null

  // Hard endurance must not precede a lower-body lift (includes cyclic Sunday→Monday)
  if (props.isHardEndurance && nextProps?.isLowerBodyIntensive) return false

  // Lower-body lift must not follow hard endurance
  if (props.isLowerBodyIntensive && prevProps?.isHardEndurance) return false

  // CNS-intensive sessions must not be back-to-back
  // Exception: 'good' recovery with 6-day plans allows one pair
  if (props.isCNSIntensive) {
    const allowBackToBack = recovery === 'good'
    if (!allowBackToBack) {
      if (prevProps?.isCNSIntensive || nextProps?.isCNSIntensive) return false
    } else {
      // Even with good recovery, never triple stack
      const prevPrev = slot >= 2 ? schedule[slot - 2] : (slot === 1 ? schedule[6] : null)
      if (prevProps?.isCNSIntensive && prevPrev && SESSION_PROPS[prevPrev]?.isCNSIntensive) return false
      if (nextProps?.isCNSIntensive && prevProps?.isCNSIntensive) return false
    }
  }

  return true
}

// Soft constraint scoring — higher = better placement
function placementScore(session: SessionType, slot: number, schedule: (SessionType | null)[]): number {
  let score = 0
  const props = SESSION_PROPS[session]

  // Long endurance prefers weekend
  if (session === 'long_endurance') {
    if (slot === 5) score += 10  // Saturday ideal
    if (slot === 6) score += 8
    if (slot === 4) score += 3
  }

  // First lower-body session prefers Monday
  if (props.isLowerBodyIntensive && props.isHeavyLift) {
    const lowerAlreadyPlaced = schedule.filter(s => s && SESSION_PROPS[s].isLowerBodyIntensive && SESSION_PROPS[s].isHeavyLift).length
    if (lowerAlreadyPlaced === 0) {
      score += (slot === 0 ? 10 : slot === 1 ? 7 : slot === 2 ? 4 : 0)
    } else {
      score += (slot === 3 ? 10 : slot === 4 ? 7 : 0)
    }
  }

  // Upper strength midweek
  if (session === 'upper_strength') {
    score += (slot === 1 ? 8 : slot === 2 ? 9 : slot === 3 ? 7 : slot === 4 ? 5 : 0)
  }

  // Zone 2 as buffer between hard sessions
  if (session === 'zone2_medium' || session === 'zone2_short') {
    const prev = slot > 0 ? schedule[slot - 1] : null
    const next = slot < 6 ? schedule[slot + 1] : null
    const prevIsHard = prev && (SESSION_PROPS[prev].isCNSIntensive || SESSION_PROPS[prev].isHardEndurance)
    const nextIsHard = next && (SESSION_PROPS[next].isCNSIntensive || SESSION_PROPS[next].isHardEndurance)
    if (prevIsHard || nextIsHard) score += 6
  }

  // Mobility adjacent to heavy lift
  if (session === 'mobility') {
    const prev = slot > 0 ? schedule[slot - 1] : null
    const next = slot < 6 ? schedule[slot + 1] : null
    if (prev && SESSION_PROPS[prev].isHeavyLift) score += 10
    if (next && SESSION_PROPS[next].isHeavyLift) score += 9
  }

  return score
}

// ---------------------------------------------------------------------------
// Step 4: Greedy placement algorithm
// ---------------------------------------------------------------------------

function seedShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function priorityOrder(sessions: SessionType[]): SessionType[] {
  const priority: Record<SessionType, number> = {
    lower_strength: 10,
    full_body_strength: 9,
    long_endurance: 8,
    upper_strength: 7,
    tempo: 6,
    intervals: 6,
    lower_hypertrophy: 5,
    upper_hypertrophy: 4,
    full_body_accessory: 3,
    zone2_medium: 2,
    zone2_short: 1,
    mobility: 0,
    rest: -1,
  }
  return [...sessions].sort((a, b) => (priority[b] ?? 0) - (priority[a] ?? 0))
}

function placeSessionsGreedy(
  sessions: SessionType[],
  recovery: RecoveryPriority,
  seed: number,
): (SessionType | null)[] {
  const schedule: (SessionType | null)[] = Array(7).fill(null)
  const ordered = priorityOrder(sessions)

  for (const session of ordered) {
    // Collect all valid slots and score them
    const candidates: { slot: number; score: number }[] = []
    for (let i = 0; i < 7; i++) {
      if (schedule[i] !== null) continue
      if (hardConstraintSatisfied(session, i, schedule, recovery)) {
        candidates.push({ slot: i, score: placementScore(session, i, schedule) })
      }
    }

    if (candidates.length > 0) {
      // Add slight randomness for regeneration (seed-based)
      const jittered = candidates.map(c => ({
        ...c,
        score: c.score + (seed > 0 ? (seedShuffle([0, 1, 2], seed + c.slot)[0] * 0.5) : 0),
      }))
      jittered.sort((a, b) => b.score - a.score)
      schedule[jittered[0].slot] = session
      continue
    }

    // No slot satisfies hard constraints — substitute hard endurance with zone2
    const substitute = (session === 'tempo' || session === 'intervals') ? 'zone2_medium' : session
    if (substitute !== session) {
      for (let i = 0; i < 7; i++) {
        if (schedule[i] !== null) continue
        if (hardConstraintSatisfied(substitute, i, schedule, recovery)) {
          schedule[i] = substitute
          break
        }
      }
      continue
    }

    // Last resort: place anywhere open
    for (let i = 0; i < 7; i++) {
      if (schedule[i] === null) {
        schedule[i] = session
        break
      }
    }
  }

  return schedule
}

// ---------------------------------------------------------------------------
// Step 5: Rationale generation
// ---------------------------------------------------------------------------

function generateRationale(
  session: SessionType,
  slot: number,
  schedule: (SessionType | null)[],
  inputs: PlannerInputs,
): string {
  const props = SESSION_PROPS[session]
  const prev = slot > 0 ? schedule[slot - 1] : null
  const next = slot < 6 ? schedule[slot + 1] : null
  const prevProps = prev ? SESSION_PROPS[prev] : null
  const nextProps = next ? SESSION_PROPS[next] : null

  if (session === 'rest') return 'Full recovery. No active sessions.'

  if (session === 'lower_strength') {
    if (slot === 0) return 'Monday — CNS is fresh after the weekend. Best position for heavy lower-body loading.'
    if (prev && SESSION_PROPS[prev].isEnduranceSession && !SESSION_PROPS[prev].isHardEndurance)
      return 'Zone 2 the day before means legs are fresh enough for heavy loading.'
    return `${DAYS[slot]} — sufficient recovery from prior lower-body work.`
  }

  if (session === 'upper_strength') {
    if (prev && prevProps?.isLowerBodyIntensive)
      return 'Lower body yesterday, upper today — alternating pattern keeps each session high quality.'
    if (prev === null || prev === 'rest')
      return 'Upper-body strength after a rest day — fresh for heavy pressing and pulling.'
    return `Upper-body strength on ${DAYS[slot]} — lower body has adequate recovery before its next session.`
  }

  if (session === 'full_body_strength') {
    if (slot === 0) return 'Monday — full-body compound strength while the CNS is fresh.'
    return `Full-body session on ${DAYS[slot]} — spaced from adjacent hard sessions.`
  }

  if (session === 'lower_hypertrophy') {
    if (prev && SESSION_PROPS[prev].isHeavyLift)
      return 'Hypertrophy volume follows the strength session — accumulated fatigue is acceptable here since intensity is lower.'
    return 'Lower-body volume work in the second half of the week — adequate recovery from early-week heavy loading.'
  }

  if (session === 'upper_hypertrophy') {
    if (next === 'rest' || next === 'zone2_short' || next === null)
      return 'Upper-body volume here with a low-stress day following — can push into fatigue without affecting downstream sessions.'
    return 'Upper-body hypertrophy placed where adjacent days are low-intensity.'
  }

  if (session === 'full_body_accessory') {
    return 'Accessory and GPP work at the end of the training week — lower intensity, supports recovery.'
  }

  if (session === 'long_endurance') {
    if (slot === 5) {
      const mondaySession = schedule[0]
      if (mondaySession && SESSION_PROPS[mondaySession].isLowerBodyIntensive)
        return 'Saturday long session — full day Sunday before Monday\'s lower-body work.'
      return 'Saturday — more time available for a longer aerobic effort.'
    }
    if (slot === 6) return 'Sunday long session — extra recovery day if needed before the training week restarts.'
    return `Long aerobic session on ${DAYS[slot]}. Weekend is preferred but adjusted around other sessions here.`
  }

  if (session === 'zone2_medium' || session === 'zone2_short') {
    if (prevProps?.isCNSIntensive || prevProps?.isHardEndurance)
      return 'Low-intensity aerobic work after a hard day — adds volume without compounding fatigue.'
    if (nextProps?.isCNSIntensive || nextProps?.isHeavyLift)
      return `Easy session before ${next ? getSessionName(next, inputs) : 'a hard session'} — arrives fresh, doesn't add recovery debt.`
    return 'Aerobic maintenance in a recovery window between hard days.'
  }

  if (session === 'tempo') {
    if (slot === 1) return 'Tuesday tempo — 48 hours after Monday heavy session, and Thursday/Friday lift is still days away.'
    if (slot === 4) return 'Friday threshold work — weekend ahead for recovery before Monday.'
    return `Threshold session on ${DAYS[slot]} — positioned to avoid interference with adjacent strength days.`
  }

  if (session === 'intervals') {
    return `High-intensity intervals on ${DAYS[slot]} — at least one day of recovery on either side.`
  }

  if (session === 'mobility') {
    if (prevProps?.isHeavyLift) return 'Active recovery after yesterday\'s heavy session — mobility work accelerates tissue turnover.'
    if (nextProps?.isHeavyLift) return 'Mobility and tissue work the day before heavy loading — arrives with better range of motion.'
    return 'Mobility session in the training week — helps offset the cumulative stiffness from heavy lifting and hard cardio.'
  }

  return `Placed on ${DAYS[slot]} based on recovery sequencing.`
}

// ---------------------------------------------------------------------------
// Step 6: Programming notes
// ---------------------------------------------------------------------------

function generateProgrammingNotes(schedule: (SessionType | null)[], inputs: PlannerInputs): string {
  const { primaryGoal, liftingStyle, enduranceVolume, enduranceFocus, recoveryPriority, trainingDays } = inputs

  const hasHardEndurance = schedule.some(s => s === 'tempo' || s === 'intervals')
  const hasLongEndurance = schedule.includes('long_endurance')
  const lowerDays = schedule.map((s, i) => ({ s, i })).filter(({ s }) => s && SESSION_PROPS[s].isLowerBodyIntensive)
  const hardAfterLower = lowerDays.some(({ i }) => {
    const next = i < 6 ? schedule[i + 1] : schedule[0]
    return next && SESSION_PROPS[next].isHardEndurance
  })

  const enduranceLabel = { running: 'running', cycling: 'riding', rowing: 'rowing', mixed: 'endurance work' }[enduranceFocus]

  const paragraphs: string[] = []

  // Interference pattern
  if (hasHardEndurance) {
    paragraphs.push(
      `The interference effect — where high-intensity cardio and heavy strength work compete for the same adaptation signals — is managed by separating hard ${enduranceLabel} from lower-body lifting by at least 48 hours. Upper-body sessions are adjacent to threshold work because the muscular overlap is minimal.`
    )
  } else {
    paragraphs.push(
      `All ${enduranceLabel} in this plan is aerobic (zone 2 or long slow distance), which runs parallel to strength adaptation rather than competing with it. This is intentional: with the lifting frequency here, adding hard cardio would compress recovery windows without producing meaningfully more endurance stimulus.`
    )
  }

  // Recovery sequencing
  paragraphs.push(
    `Alternating hard and easy days is the core sequencing principle. CNS-intensive sessions — heavy compounds and${hasHardEndurance ? ' quality cardio' : ''} heavy strength days — are separated by at least one low-demand day. ${recoveryPriority === 'careful' ? 'Given your recovery priority, session pairings are conservative — no two demanding sessions on consecutive days.' : recoveryPriority === 'good' ? 'With your recovery capacity, some back-to-back demanding sessions are included where the training stimulus warrants it.' : 'Adjacent sessions are kept compatible — strength and easy aerobic can share consecutive days.'}`
  )

  // Lower body emphasis
  if (lowerDays.length >= 2) {
    paragraphs.push(
      `Lower-body strength sessions anchor the early part of the week while CNS readiness is highest. The second lower-body session is in the second half of the week with enough buffer to recover before the cycle repeats. If ${enduranceLabel} volume is high in a given week, treat the second lower session as technique-focused rather than pushing intensity.`
    )
  }

  // Long run / endurance logic
  if (hasLongEndurance) {
    paragraphs.push(
      `The long ${enduranceLabel.replace('work', 'session')} sits on the weekend — more time available, and it positions the residual fatigue to dissipate over a rest day before the following Monday's heavy session. Don't race the long session; it should feel conversational at the end, not just the beginning.`
    )
  }

  // Deload note
  paragraphs.push(
    `Run this block for 3 weeks at full effort, then take a deload week: cut volume 40%, keep intensity. The plan structure stays the same — just fewer sets and a slower long ${enduranceLabel.replace('work', 'effort')}.`
  )

  return paragraphs.join('\n\n')
}

// ---------------------------------------------------------------------------
// Deload transformations
// ---------------------------------------------------------------------------

const DELOAD_SESSION_MAP: Partial<Record<SessionType, SessionType>> = {
  lower_strength:     'lower_hypertrophy',
  upper_strength:     'upper_hypertrophy',
  full_body_strength: 'full_body_accessory',
  long_endurance:     'zone2_medium',
  tempo:              'zone2_short',
  intervals:          'zone2_short',
}

const DELOAD_DURATION: Partial<Record<SessionType, string>> = {
  lower_hypertrophy:   '45–55 min',
  upper_hypertrophy:   '40–50 min',
  full_body_accessory: '35–45 min',
  zone2_medium:        '35–45 min',
  zone2_short:         '25–30 min',
  mobility:            '30–40 min',
}

function applyDeload(days: DayPlan[], inputs: PlannerInputs): DayPlan[] {
  return days.map(day => {
    if (day.sessionType === 'rest') return day
    const deloadType = DELOAD_SESSION_MAP[day.sessionType] ?? day.sessionType
    return {
      ...day,
      sessionType: deloadType,
      sessionName: `Deload — ${getSessionName(deloadType, inputs)}`,
      estimatedDuration: DELOAD_DURATION[deloadType] ?? day.estimatedDuration,
      rationale: 'Deload week: cut volume by 40%, keep weights the same. Focus on quality movement, not effort.',
    }
  })
}

function generateDeloadNotes(inputs: PlannerInputs): string {
  const enduranceLabel = { running: 'running', cycling: 'riding', rowing: 'rowing', mixed: 'endurance work' }[inputs.enduranceFocus]
  return [
    `This is your deload week. The day structure is identical to your normal training week — only the sessions have changed. Heavy lifting is replaced with hypertrophy or accessory work, and any hard cardio drops to easy aerobic sessions.`,
    `Cut your usual sets by 40–50% and keep the weights the same. The goal is not to train hard — it is to flush accumulated fatigue and let your body lock in the adaptations from the previous 3–4 weeks. You should feel almost under-stimulated. That is the point.`,
    `Keep RPE at 6 or below on all lifting. For ${enduranceLabel}, stay strictly in zone 2 and cut duration by a third. Resist the urge to push on the last day because you feel fresh — you feel fresh because you rested.`,
    `Resume your normal plan the following Monday. If you still feel flat or beat up, extend the deload by 2–3 days before ramping back up.`,
  ].join('\n\n')
}

// ---------------------------------------------------------------------------
// Public API: generatePlan
// ---------------------------------------------------------------------------

export function generatePlan(inputs: PlannerInputs, seed = 0): WeeklyPlan {
  const counts = computeSessionCounts(inputs)
  const liftingSessions = buildLiftingSessions(inputs.liftingStyle, counts.liftingCount, inputs.primaryGoal)
  const enduranceSessions = buildEnduranceSessions(counts.enduranceCount, inputs.primaryGoal, inputs.enduranceVolume)

  const allSessions: SessionType[] = [
    ...liftingSessions,
    ...enduranceSessions,
    ...(counts.mobilityCount > 0 ? (['mobility'] as SessionType[]) : []),
  ]

  const rawSchedule = placeSessionsGreedy(allSessions, inputs.recoveryPriority, seed)

  // Fill empty slots with rest
  const schedule = rawSchedule.map(s => s ?? ('rest' as SessionType))

  let days: DayPlan[] = schedule.map((sessionType, i) => ({
    day: DAYS[i],
    sessionType,
    sessionName: getSessionName(sessionType, inputs),
    estimatedDuration: getSessionDuration(sessionType, inputs),
    rationale: generateRationale(sessionType, i, schedule, inputs),
  }))

  if (inputs.isDeload) {
    days = applyDeload(days, inputs)
  }

  const programmingNotes = inputs.isDeload
    ? generateDeloadNotes(inputs)
    : generateProgrammingNotes(schedule, inputs)

  return { days, programmingNotes, inputs }
}

// ---------------------------------------------------------------------------
// Public API: getValidSwapsForDay
// Used by the session swap modal in /plan/:id
// ---------------------------------------------------------------------------

export function getValidSwapsForDay(plan: WeeklyPlan, dayIndex: number): DayPlan[] {
  const currentType = plan.days[dayIndex].sessionType
  const schedule = plan.days.map(d => d.sessionType)

  // Build a test schedule without the current session to check placements
  const testSchedule: (SessionType | null)[] = schedule.map((s, i) =>
    i === dayIndex ? null : s
  )

  const existingLiftCount = schedule.filter(s => SESSION_PROPS[s].isLiftSession).length
  const existingEnduranceCount = schedule.filter(s => SESSION_PROPS[s].isEnduranceSession).length
  const existingLongCount = schedule.filter(s => s === 'long_endurance').length
  const existingMobility = schedule.includes('mobility')

  const isCurrentLift = SESSION_PROPS[currentType].isLiftSession
  const isCurrentEndurance = SESSION_PROPS[currentType].isEnduranceSession

  // Order candidates so same-category alternatives come first
  const liftAlternatives: SessionType[] = [
    'lower_strength', 'upper_strength', 'full_body_strength',
    'lower_hypertrophy', 'upper_hypertrophy', 'full_body_accessory',
  ]
  const enduranceAlternatives: SessionType[] = [
    'long_endurance', 'tempo', 'intervals', 'zone2_medium', 'zone2_short',
  ]
  const recoveryOptions: SessionType[] = ['mobility', 'rest']

  const candidates: SessionType[] = isCurrentEndurance
    ? [...enduranceAlternatives, ...liftAlternatives, ...recoveryOptions]
    : [...liftAlternatives, ...enduranceAlternatives, ...recoveryOptions]

  return candidates
    .filter(c => {
      if (c === currentType) return false
      if (c === 'long_endurance' && existingLongCount >= 1) return false
      if (c === 'mobility' && existingMobility && currentType !== 'mobility') return false
      if (SESSION_PROPS[c].isLiftSession && existingLiftCount >= 5) return false
      return hardConstraintSatisfied(c, dayIndex, testSchedule, plan.inputs.recoveryPriority)
    })
    .slice(0, 6)
    .map(type => ({
      day: DAYS[dayIndex],
      sessionType: type,
      sessionName: getSessionName(type, plan.inputs),
      estimatedDuration: getSessionDuration(type, plan.inputs),
      rationale: generateRationale(type, dayIndex, [...testSchedule.slice(0, dayIndex), type, ...testSchedule.slice(dayIndex + 1)] as SessionType[], plan.inputs),
    }))
}

// ---------------------------------------------------------------------------
// Exercise recommendations
// ---------------------------------------------------------------------------

export interface ExerciseItem {
  name: string
  sets: string
  reps: string
  note?: string
}

const LIFTING_EXERCISES: Partial<Record<SessionType, Record<LiftingStyle, ExerciseItem[]>>> = {
  lower_strength: {
    strength: [
      { name: 'Back Squat',            sets: '4', reps: '3-5',    note: 'Hit depth — 85%+' },
      { name: 'Conventional Deadlift', sets: '3', reps: '3-5',    note: '85%+' },
      { name: 'Leg Press',             sets: '3', reps: '8' },
      { name: 'Hamstring Curl',        sets: '3', reps: '8-10' },
      { name: 'Standing Calf Raise',   sets: '3', reps: '15' },
    ],
    powerbuilding: [
      { name: 'Back Squat',            sets: '4', reps: '3-5',   note: '85%+' },
      { name: 'Conventional Deadlift', sets: '3', reps: '3',     note: 'Heavy triple' },
      { name: 'Romanian Deadlift',     sets: '3', reps: '8' },
      { name: 'Leg Curl',              sets: '3', reps: '10' },
      { name: 'Calf Raise',            sets: '3', reps: '12' },
    ],
    bodybuilding: [
      { name: 'Squat',                 sets: '4', reps: '6-8',   note: 'Controlled tempo' },
      { name: 'Romanian Deadlift',     sets: '3', reps: '10' },
      { name: 'Leg Press',             sets: '4', reps: '12' },
      { name: 'Leg Extension',         sets: '3', reps: '15' },
      { name: 'Lying Leg Curl',        sets: '3', reps: '12' },
      { name: 'Standing Calf Raise',   sets: '4', reps: '15' },
    ],
    functional: [
      { name: 'Back Squat',            sets: '4', reps: '4-6' },
      { name: 'Single-leg RDL',        sets: '3', reps: '8 / leg' },
      { name: 'KB Step-up',            sets: '3', reps: '10 / leg' },
      { name: 'KB Swing',              sets: '4', reps: '15' },
      { name: 'Sled Push',             sets: '3', reps: '20 m' },
    ],
  },
  upper_strength: {
    strength: [
      { name: 'Bench Press',           sets: '4', reps: '3-5',   note: '85%+' },
      { name: 'Barbell Row',           sets: '4', reps: '4-6' },
      { name: 'Overhead Press',        sets: '3', reps: '5' },
      { name: 'Weighted Pull-up',      sets: '3', reps: '4-6' },
      { name: 'Weighted Dip',          sets: '3', reps: '6-8' },
    ],
    powerbuilding: [
      { name: 'Bench Press',           sets: '4', reps: '4-6',   note: '80-85%' },
      { name: 'Barbell Row',           sets: '4', reps: '5' },
      { name: 'Overhead Press',        sets: '3', reps: '5-6' },
      { name: 'Weighted Pull-up',      sets: '3', reps: '5' },
      { name: 'Dips',                  sets: '3', reps: '6-8' },
    ],
    bodybuilding: [
      { name: 'Incline DB Press',      sets: '4', reps: '8-10' },
      { name: 'Cable Row',             sets: '4', reps: '10-12' },
      { name: 'DB Shoulder Press',     sets: '3', reps: '10' },
      { name: 'Lat Pulldown',          sets: '3', reps: '12' },
      { name: 'Lateral Raise',         sets: '3', reps: '15' },
      { name: 'Overhead Tricep Ext.',  sets: '3', reps: '12' },
    ],
    functional: [
      { name: 'Push Press',            sets: '4', reps: '4-6' },
      { name: 'Pendlay Row',           sets: '4', reps: '5' },
      { name: 'Turkish Get-up',        sets: '3', reps: '3 / side' },
      { name: 'Ring Dip',              sets: '3', reps: '8' },
      { name: 'TRX Row',               sets: '3', reps: '10' },
    ],
  },
  lower_hypertrophy: {
    strength: [
      { name: 'Front Squat',           sets: '3', reps: '6-8' },
      { name: 'Romanian Deadlift',     sets: '3', reps: '8-10' },
      { name: 'Leg Press',             sets: '3', reps: '12' },
      { name: 'Nordic Curl',           sets: '3', reps: '8',    note: '4-sec eccentric' },
      { name: 'Calf Raise',            sets: '4', reps: '15' },
    ],
    powerbuilding: [
      { name: 'Back Squat',            sets: '4', reps: '8-10' },
      { name: 'Romanian Deadlift',     sets: '3', reps: '10' },
      { name: 'Leg Press',             sets: '3', reps: '12' },
      { name: 'Leg Extension',         sets: '3', reps: '15' },
      { name: 'Lying Leg Curl',        sets: '3', reps: '12' },
      { name: 'Calf Raise',            sets: '3', reps: '15' },
    ],
    bodybuilding: [
      { name: 'Squat',                 sets: '4', reps: '10-12' },
      { name: 'Romanian Deadlift',     sets: '4', reps: '12' },
      { name: 'Leg Press',             sets: '4', reps: '15' },
      { name: 'Leg Extension',         sets: '4', reps: '15-20', note: 'Squeeze at top' },
      { name: 'Lying Leg Curl',        sets: '4', reps: '12-15' },
      { name: 'Seated Calf Raise',     sets: '4', reps: '20' },
    ],
    functional: [
      { name: 'Goblet Squat',          sets: '4', reps: '10' },
      { name: 'Bulgarian Split Squat', sets: '3', reps: '10 / leg' },
      { name: 'KB Swing',              sets: '4', reps: '15' },
      { name: 'Box Jump',              sets: '3', reps: '5',    note: 'Full reset each rep' },
      { name: 'Single-leg Hip Thrust', sets: '3', reps: '12 / leg' },
    ],
  },
  upper_hypertrophy: {
    strength: [
      { name: 'Close-grip Bench Press', sets: '3', reps: '6-8' },
      { name: 'Dumbbell Row',           sets: '3', reps: '10-12' },
      { name: 'Arnold Press',           sets: '3', reps: '10' },
      { name: 'EZ Bar Curl',            sets: '3', reps: '12' },
      { name: 'Tricep Pushdown',        sets: '3', reps: '12' },
    ],
    powerbuilding: [
      { name: 'Incline Bench Press',    sets: '4', reps: '8-10' },
      { name: 'Pendlay Row',            sets: '3', reps: '8-10' },
      { name: 'DB Shoulder Press',      sets: '3', reps: '10' },
      { name: 'Lat Pulldown',           sets: '3', reps: '12' },
      { name: 'Tricep Pushdown',        sets: '3', reps: '15' },
      { name: 'Cable Curl',             sets: '3', reps: '12' },
    ],
    bodybuilding: [
      { name: 'Incline DB Press',       sets: '4', reps: '10-12' },
      { name: 'Seated Cable Row',       sets: '4', reps: '12' },
      { name: 'Lateral Raise',          sets: '4', reps: '15',   note: 'Slight forward lean' },
      { name: 'Cable Curl',             sets: '4', reps: '15' },
      { name: 'Overhead Tricep Ext.',   sets: '4', reps: '12' },
      { name: 'Face Pull',              sets: '3', reps: '15',   note: 'Pull to forehead' },
    ],
    functional: [
      { name: 'Ring Push-up',           sets: '4', reps: '10' },
      { name: 'TRX Row',                sets: '4', reps: '12' },
      { name: 'KB Clean & Press',       sets: '3', reps: '8 / side' },
      { name: 'Band Pull-apart',        sets: '3', reps: '20' },
      { name: 'Pike Press',             sets: '3', reps: '8' },
    ],
  },
  full_body_strength: {
    strength: [
      { name: 'Deadlift',              sets: '4', reps: '3-5',   note: '85%+' },
      { name: 'Bench Press',           sets: '3', reps: '5' },
      { name: 'Barbell Row',           sets: '3', reps: '5' },
      { name: 'Overhead Press',        sets: '3', reps: '5' },
      { name: 'Weighted Pull-up',      sets: '3', reps: '5' },
    ],
    powerbuilding: [
      { name: 'Deadlift',              sets: '4', reps: '4-6' },
      { name: 'Bench Press',           sets: '3', reps: '5' },
      { name: 'Back Squat',            sets: '3', reps: '5' },
      { name: 'Barbell Row',           sets: '3', reps: '6' },
      { name: 'Overhead Press',        sets: '3', reps: '6' },
    ],
    bodybuilding: [
      { name: 'Deadlift',              sets: '3', reps: '6-8' },
      { name: 'Bench Press',           sets: '3', reps: '8' },
      { name: 'Pull-up',               sets: '3', reps: '8-10' },
      { name: 'Overhead Press',        sets: '3', reps: '8' },
      { name: 'Romanian Deadlift',     sets: '3', reps: '10' },
    ],
    functional: [
      { name: 'Clean & Press',         sets: '4', reps: '4' },
      { name: 'Deadlift',              sets: '3', reps: '5' },
      { name: 'Ring Dip',              sets: '3', reps: '8' },
      { name: 'Pull-up',               sets: '3', reps: '8' },
      { name: "Farmer's Carry",        sets: '3', reps: '40 m' },
    ],
  },
  full_body_accessory: {
    strength: [
      { name: 'Nordic Curl',           sets: '3', reps: '8',    note: 'Slow eccentric' },
      { name: 'Face Pull',             sets: '3', reps: '15' },
      { name: 'Single-leg Hip Thrust', sets: '3', reps: '12 / leg' },
      { name: 'Pallof Press',          sets: '3', reps: '12 / side' },
      { name: 'Band Pull-apart',       sets: '3', reps: '20' },
    ],
    powerbuilding: [
      { name: 'GHR / Nordic Curl',     sets: '3', reps: '8' },
      { name: 'Face Pull',             sets: '3', reps: '15' },
      { name: 'Hip Thrust',            sets: '3', reps: '12' },
      { name: 'Lateral Raise',         sets: '3', reps: '15' },
      { name: 'Bicep Curl',            sets: '3', reps: '12' },
      { name: 'Tricep Pushdown',       sets: '3', reps: '15' },
    ],
    bodybuilding: [
      { name: 'Cable Curl',            sets: '3', reps: '15' },
      { name: 'Overhead Tricep Ext.',  sets: '3', reps: '15' },
      { name: 'Lateral Raise',         sets: '4', reps: '15' },
      { name: 'Rear Delt Fly',         sets: '3', reps: '15' },
      { name: 'Leg Extension',         sets: '3', reps: '20' },
      { name: 'Leg Curl',              sets: '3', reps: '15' },
    ],
    functional: [
      { name: 'KB Swing',              sets: '4', reps: '20' },
      { name: 'Battle Rope',           sets: '4', reps: '30 sec' },
      { name: 'Sled Push/Pull',        sets: '3', reps: '20 m' },
      { name: 'Bear Crawl',            sets: '3', reps: '20 m' },
      { name: 'Band Pull-apart',       sets: '3', reps: '20' },
    ],
  },
}

const ENDURANCE_EXERCISES: Partial<Record<SessionType, Record<EnduranceFocus, ExerciseItem[]>>> = {
  long_endurance: {
    running: [
      { name: 'Warm-up walk/jog',   sets: '1', reps: '5-10 min' },
      { name: 'Easy Z2 run',        sets: '1', reps: '60-90 min', note: 'Conversational pace — HR 60-70%' },
      { name: 'Cool-down walk',     sets: '1', reps: '5 min' },
    ],
    cycling: [
      { name: 'Easy spin warm-up',  sets: '1', reps: '10 min' },
      { name: 'Steady Z2 ride',     sets: '1', reps: '75-100 min', note: '60-70% FTP — aerobic base' },
      { name: 'Cool-down spin',     sets: '1', reps: '5 min' },
    ],
    rowing: [
      { name: 'Warm-up row',        sets: '1', reps: '5 min easy' },
      { name: 'Steady-state erg',   sets: '1', reps: '45-60 min', note: 'Comfortable split — damper 4-5' },
      { name: 'Cool-down',          sets: '1', reps: '5 min easy' },
    ],
    mixed: [
      { name: 'Warm-up',            sets: '1', reps: '10 min easy' },
      { name: 'Long aerobic effort', sets: '1', reps: '60-90 min', note: 'Any modality — HR 60-70%' },
      { name: 'Cool-down',          sets: '1', reps: '5-10 min' },
    ],
  },
  zone2_medium: {
    running: [
      { name: 'Warm-up jog',        sets: '1', reps: '5 min' },
      { name: 'Zone 2 run',         sets: '1', reps: '35-45 min', note: 'Should hold a full conversation' },
      { name: 'Cool-down walk',     sets: '1', reps: '5 min' },
    ],
    cycling: [
      { name: 'Easy spin',          sets: '1', reps: '5 min' },
      { name: 'Zone 2 ride',        sets: '1', reps: '40-50 min', note: '55-65% FTP' },
      { name: 'Cool-down spin',     sets: '1', reps: '5 min' },
    ],
    rowing: [
      { name: 'Warm-up',            sets: '1', reps: '3 min easy' },
      { name: 'Zone 2 row',         sets: '1', reps: '30-40 min', note: 'Comfortable sustainable pace' },
      { name: 'Cool-down',          sets: '1', reps: '3 min easy' },
    ],
    mixed: [
      { name: 'Warm-up',            sets: '1', reps: '5 min' },
      { name: 'Zone 2 session',     sets: '1', reps: '35-45 min', note: 'HR 60-70% max throughout' },
      { name: 'Cool-down',          sets: '1', reps: '5 min' },
    ],
  },
  zone2_short: {
    running: [
      { name: 'Walk/jog',           sets: '1', reps: '5 min' },
      { name: 'Easy recovery run',  sets: '1', reps: '20-25 min', note: 'Go slower than feels necessary' },
      { name: 'Cool-down walk',     sets: '1', reps: '5 min' },
    ],
    cycling: [
      { name: 'Easy spin',          sets: '1', reps: '5 min' },
      { name: 'Recovery ride',      sets: '1', reps: '20-30 min', note: 'Very easy — under 55% FTP' },
      { name: 'Cool-down',          sets: '1', reps: '5 min' },
    ],
    rowing: [
      { name: 'Warm-up',            sets: '1', reps: '3 min' },
      { name: 'Easy row',           sets: '1', reps: '15-20 min', note: 'Low rate — technique focus' },
      { name: 'Cool-down',          sets: '1', reps: '3 min' },
    ],
    mixed: [
      { name: 'Warm-up',            sets: '1', reps: '5 min' },
      { name: 'Easy aerobic work',  sets: '1', reps: '20-25 min', note: 'Pure recovery — keep HR low' },
      { name: 'Cool-down',          sets: '1', reps: '5 min' },
    ],
  },
  tempo: {
    running: [
      { name: 'Warm-up jog',        sets: '1', reps: '10-15 min' },
      { name: 'Threshold run',      sets: '1', reps: '20-25 min', note: '~80-85% HR — comfortably hard' },
      { name: 'Cool-down jog',      sets: '1', reps: '10 min' },
    ],
    cycling: [
      { name: 'Warm-up spin',       sets: '1', reps: '10 min' },
      { name: 'Tempo ride',         sets: '1', reps: '20-25 min', note: '76-90% FTP — sustainable but hard' },
      { name: 'Cool-down spin',     sets: '1', reps: '10 min' },
    ],
    rowing: [
      { name: 'Warm-up',            sets: '1', reps: '8 min easy' },
      { name: 'Threshold row',      sets: '1', reps: '16-20 min', note: 'Hard but controlled split' },
      { name: 'Cool-down',          sets: '1', reps: '8 min easy' },
    ],
    mixed: [
      { name: 'Warm-up',            sets: '1', reps: '10-15 min' },
      { name: 'Threshold effort',   sets: '1', reps: '20-25 min', note: '80-85% HR — hard to speak in full sentences' },
      { name: 'Cool-down',          sets: '1', reps: '10 min' },
    ],
  },
  intervals: {
    running: [
      { name: 'Warm-up jog',        sets: '1', reps: '15 min' },
      { name: '800 m intervals',    sets: '5-8', reps: '800 m @ 5K pace', note: '2 min easy jog rest between' },
      { name: 'Cool-down jog',      sets: '1', reps: '10 min' },
    ],
    cycling: [
      { name: 'Warm-up spin',       sets: '1', reps: '10 min' },
      { name: 'VO2max intervals',   sets: '5-6', reps: '3 min @ 105-120% FTP', note: '3 min easy rest between' },
      { name: 'Cool-down spin',     sets: '1', reps: '10 min' },
    ],
    rowing: [
      { name: 'Warm-up row',        sets: '1', reps: '10 min easy' },
      { name: 'Power intervals',    sets: '6-8', reps: '250 m all-out', note: '2 min full rest between' },
      { name: 'Cool-down',          sets: '1', reps: '8 min easy' },
    ],
    mixed: [
      { name: 'Warm-up',            sets: '1', reps: '10-15 min' },
      { name: 'Hard intervals',     sets: '5-8', reps: '2-3 min hard', note: '90-95% HR — full rest between' },
      { name: 'Cool-down',          sets: '1', reps: '10 min' },
    ],
  },
}

const MOBILITY_EXERCISES: ExerciseItem[] = [
  { name: 'Cat-cow',               sets: '2', reps: '10 reps',      note: 'Slow and deliberate' },
  { name: 'Hip 90/90 stretch',     sets: '2', reps: '60 sec / side' },
  { name: 'Thoracic rotation',     sets: '2', reps: '10 reps / side' },
  { name: 'Couch stretch',         sets: '2', reps: '60 sec / side', note: 'Press hip forward gently' },
  { name: 'Downward dog flow',     sets: '2', reps: '10 slow reps' },
  { name: 'Thread the needle',     sets: '2', reps: '45 sec / side' },
]

export function getSessionExercises(sessionType: SessionType, inputs: PlannerInputs): ExerciseItem[] {
  if (sessionType === 'rest') return []
  if (sessionType === 'mobility') return MOBILITY_EXERCISES
  if (SESSION_PROPS[sessionType].isEnduranceSession) {
    return ENDURANCE_EXERCISES[sessionType]?.[inputs.enduranceFocus] ?? []
  }
  return LIFTING_EXERCISES[sessionType]?.[inputs.liftingStyle] ?? []
}

// ---------------------------------------------------------------------------
// Utility: export plan to plain text
// ---------------------------------------------------------------------------

export function planToText(plan: WeeklyPlan): string {
  const lines: string[] = ['SPLIT — Weekly Training Plan', '='.repeat(40), '']

  for (const day of plan.days) {
    lines.push(`${day.day.toUpperCase()}`)
    lines.push(`  ${day.sessionName} (${day.estimatedDuration})`)
    if (day.sessionType !== 'rest') lines.push(`  → ${day.rationale}`)
    lines.push('')
  }

  lines.push('PROGRAMMING NOTES', '-'.repeat(40))
  lines.push(plan.programmingNotes)

  return lines.join('\n')
}

export function downloadPlan(plan: WeeklyPlan): void {
  const text = planToText(plan)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${plan.inputs.isDeload ? 'deload' : 'training'}-week.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
