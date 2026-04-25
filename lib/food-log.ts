export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
}

export const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks']

export interface FoodEntry {
  id: string
  food_name: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  grams: number
  meal_type: MealType
  logged_date: string
}

export interface NutritionTarget {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface FoodSearchResult {
  id: string | number
  name: string
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  servingGrams: number | null
  householdServing: string | null
}
