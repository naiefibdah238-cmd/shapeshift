import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  // Verify the caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service-role client to bypass RLS
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.listUsers()
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: planRows } = await admin.from('plans').select('user_id')
  const { data: foodRows } = await admin
    .from('food_log')
    .select('user_id, logged_date, calories, protein_g')

  // Aggregate plan counts
  const planCount: Record<string, number> = {}
  planRows?.forEach(p => {
    planCount[p.user_id] = (planCount[p.user_id] ?? 0) + 1
  })

  // Aggregate food stats
  type FoodStats = { days: Set<string>; totalCals: number; totalProtein: number; lastDate: string }
  const foodStats: Record<string, FoodStats> = {}
  foodRows?.forEach(f => {
    if (!foodStats[f.user_id]) {
      foodStats[f.user_id] = { days: new Set(), totalCals: 0, totalProtein: 0, lastDate: '' }
    }
    const s = foodStats[f.user_id]
    s.days.add(f.logged_date)
    s.totalCals += f.calories
    s.totalProtein += Number(f.protein_g)
    if (f.logged_date > s.lastDate) s.lastDate = f.logged_date
  })

  const users = authData.users.map(u => {
    const food = foodStats[u.id]
    const daysLogged = food?.days.size ?? 0
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      plan_count: planCount[u.id] ?? 0,
      days_logged: daysLogged,
      avg_calories: daysLogged > 0 ? Math.round(food.totalCals / daysLogged) : 0,
      avg_protein: daysLogged > 0 ? Math.round(food.totalProtein / daysLogged) : 0,
      last_food_date: food?.lastDate ?? null,
    }
  })

  // Sort newest users first
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ users })
}
