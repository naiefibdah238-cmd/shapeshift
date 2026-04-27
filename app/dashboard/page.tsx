import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import DailyQuote from '@/components/DailyQuote'

interface SavedPlan {
  id: string
  name: string
  created_at: string
  inputs: {
    primaryGoal: string
    trainingDays: number
  }
}

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength-biased',
  endurance: 'Endurance-biased',
  balanced: 'Balanced hybrid',
  recomp: 'Body recomp',
}

function formatLocalDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: formatLocalDate(monday),
    to: formatLocalDate(sunday),
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, created_at, inputs')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Weekly food log stats
  const { from, to } = getWeekRange()
  const { data: weekLog } = await supabase
    .from('food_log')
    .select('logged_date, calories, protein_g')
    .eq('user_id', user.id)
    .gte('logged_date', from)
    .lte('logged_date', to)

  const daysLogged = new Set(weekLog?.map(e => e.logged_date) ?? []).size
  const totalCals = weekLog?.reduce((a, e) => a + e.calories, 0) ?? 0
  const totalProtein = weekLog?.reduce((a, e) => a + Number(e.protein_g), 0) ?? 0
  const avgCals = daysLogged > 0 ? Math.round(totalCals / daysLogged) : 0
  const avgProtein = daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <DailyQuote />

        {/* Weekly summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-rule border border-rule mb-10">
          {[
            { label: 'Days logged', value: daysLogged, unit: '/ 7', highlight: daysLogged >= 5 },
            { label: 'Avg calories', value: avgCals > 0 ? avgCals.toLocaleString() : '—', unit: avgCals > 0 ? 'kcal/day' : '' },
            { label: 'Avg protein', value: avgProtein > 0 ? avgProtein : '—', unit: avgProtein > 0 ? 'g/day' : '' },
            { label: 'Saved plans', value: plans?.length ?? 0, unit: '' },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-5 py-5">
              <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold tracking-tight ${stat.highlight ? 'text-accent' : 'text-ink'}`}>
                {stat.value}
                {stat.unit && <span className="text-sm font-normal text-muted ml-1">{stat.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between mb-6">
          <h2 className="text-base font-semibold text-ink tracking-tight">My plans</h2>
          <Link href="/planner" className="btn-primary text-xs px-4 py-2">
            New plan
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-6">Failed to load plans. Refresh to try again.</p>
        )}

        {!plans || plans.length === 0 ? (
          <div className="border border-rule bg-white px-8 py-20 text-center">
            <div className="max-w-xs mx-auto">
              <p className="text-2xl font-bold text-ink mb-3">No plans yet</p>
              <p className="text-sm text-muted mb-8 leading-relaxed">
                Answer a few questions about your training and we'll build a smart hybrid week around your schedule.
              </p>
              <Link href="/planner" className="btn-primary px-8 py-3 text-sm">
                Build my first plan
              </Link>
              <p className="text-2xs text-muted mt-4">Free forever · Takes 2 minutes</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(plans as SavedPlan[]).map(plan => (
              <Link
                key={plan.id}
                href={`/plan/${plan.id}`}
                className="group border border-rule bg-white hover:border-ink hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 p-6 flex flex-col gap-4"
              >
                <div className="flex-1">
                  <p className="text-base font-semibold text-ink group-hover:text-accent transition-colors leading-snug mb-3">
                    {plan.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xs font-semibold tracking-widest uppercase border border-rule px-2 py-1 text-muted">
                      {GOAL_LABELS[plan.inputs?.primaryGoal] ?? plan.inputs?.primaryGoal}
                    </span>
                    <span className="text-2xs font-semibold tracking-widest uppercase border border-rule px-2 py-1 text-muted">
                      {plan.inputs?.trainingDays} days/wk
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-rule">
                  <span className="text-2xs text-muted">
                    {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-2xs text-muted group-hover:text-accent transition-colors">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
