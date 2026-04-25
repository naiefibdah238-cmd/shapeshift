export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type NutritionGoal = 'strength' | 'endurance' | 'balanced' | 'recomp' | 'lose_fat'

export interface NutritionInputs {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  goal: NutritionGoal
  units: 'metric' | 'imperial'
}

export interface MacroTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  proteinCal: number
  carbsCal: number
  fatCal: number
}

export interface MealTiming {
  label: string
  time: string
  description: string
  focus: string
}

export interface NutritionResult {
  bmr: number
  tdee: number
  targets: MacroTargets
  mealTiming: MealTiming[]
  notes: string[]
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
}

// Mifflin-St Jeor equation
function calcBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

function calcMacros(tdee: number, weightKg: number, goal: NutritionGoal): MacroTargets {
  let calories = tdee
  let proteinPerKg: number
  let fatPercent: number

  switch (goal) {
    case 'strength':
      // Slight surplus, high protein, moderate carbs
      calories = Math.round(tdee * 1.1)
      proteinPerKg = 2.2
      fatPercent = 0.28
      break
    case 'endurance':
      // Maintenance, carb-heavy for fuel
      calories = tdee
      proteinPerKg = 1.6
      fatPercent = 0.22
      break
    case 'balanced':
      // Maintenance, high protein for both adaptations
      calories = tdee
      proteinPerKg = 2.0
      fatPercent = 0.25
      break
    case 'recomp':
      // Small deficit, very high protein to preserve muscle
      calories = Math.round(tdee * 0.9)
      proteinPerKg = 2.4
      fatPercent = 0.25
      break
    case 'lose_fat':
      // Moderate deficit
      calories = Math.round(tdee * 0.8)
      proteinPerKg = 2.2
      fatPercent = 0.28
      break
  }

  const proteinG = Math.round(weightKg * proteinPerKg)
  const proteinCal = proteinG * 4
  const fatCal = Math.round(calories * fatPercent)
  const fatG = Math.round(fatCal / 9)
  const carbsCal = calories - proteinCal - fatCal
  const carbsG = Math.round(carbsCal / 4)

  return { calories, proteinG, carbsG, fatG, proteinCal, carbsCal, fatCal }
}

function getMealTiming(goal: NutritionGoal): MealTiming[] {
  const timings: MealTiming[] = [
    {
      label: 'Morning / Wake',
      time: '30–60 min after waking',
      description: 'Break the overnight fast with protein.',
      focus: `30–40g protein + fruit or oats. Keeps muscle protein synthesis elevated from the start of the day.`,
    },
    {
      label: 'Pre-workout',
      time: '2–3 hours before training',
      description: 'Fuel the session without gut issues.',
      focus: goal === 'endurance'
        ? 'Carb-heavy meal: oats, rice, or pasta + moderate protein. Prioritise glycogen for long efforts.'
        : 'Balanced meal: protein + complex carbs + low fat. Fat slows digestion — keep it minimal pre-session.',
    },
    {
      label: 'Intra-workout',
      time: 'During sessions over 75 min',
      description: 'Only relevant for long efforts.',
      focus: goal === 'endurance'
        ? '30–60g carbs per hour for sessions over 75 min. Gels, chews, or diluted sports drink.'
        : 'Strength sessions under 90 min: water is enough. Longer sessions: 20–30g fast carbs if needed.',
    },
    {
      label: 'Post-workout',
      time: 'Within 1–2 hours after training',
      description: 'Recovery window — hit protein and carbs.',
      focus: `40–50g protein + ${goal === 'endurance' ? 'generous carbs (1–1.2g/kg) to restock glycogen' : 'moderate carbs (0.5–0.8g/kg)'}. This is the most important meal on training days.`,
    },
    {
      label: 'Evening / Pre-sleep',
      time: '1–2 hours before bed',
      description: 'Slow protein to support overnight recovery.',
      focus: '30–40g casein (cottage cheese, Greek yogurt, or casein shake). Extends muscle protein synthesis through sleep.',
    },
  ]

  return timings
}

function getNotes(goal: NutritionGoal, targets: MacroTargets): string[] {
  const notes: string[] = []

  notes.push(
    `These are starting targets, not exact prescriptions. Track for 2–3 weeks and adjust based on body weight trend and performance — if strength is dropping on a recomp, eat more.`
  )

  if (goal === 'recomp') {
    notes.push(
      `Body recomp requires patience. Expect 0.5–1kg of fat loss per month with minimal muscle loss when protein is high. The scale will barely move — track measurements and performance instead.`
    )
  }

  if (goal === 'endurance') {
    notes.push(
      `On long run days, carb intake should be higher than the daily target — up to 6–8g/kg body weight. On rest days, pull carbs back and keep protein high.`
    )
  }

  if (goal === 'strength') {
    notes.push(
      `The 10% surplus is conservative. If you're not gaining strength over 4 weeks, eat more. If you're gaining fat faster than muscle, pull back slightly.`
    )
  }

  notes.push(
    `Protein targets for hybrid athletes are higher than general recommendations because you're creating two types of tissue damage (mechanical from lifting, metabolic from cardio). ${targets.proteinG}g/day is your floor, not your ceiling.`
  )

  return notes
}

export function calculateNutrition(inputs: NutritionInputs): NutritionResult {
  let { weightKg, heightCm } = inputs

  // Convert imperial to metric if needed
  if (inputs.units === 'imperial') {
    weightKg = inputs.weightKg * 0.453592
    heightCm = inputs.heightCm * 2.54
  }

  const bmr = Math.round(calcBMR(weightKg, heightCm, inputs.age, inputs.sex))
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel])
  const targets = calcMacros(tdee, weightKg, inputs.goal)
  const mealTiming = getMealTiming(inputs.goal)
  const notes = getNotes(inputs.goal, targets)

  return { bmr, tdee, targets, mealTiming, notes }
}
