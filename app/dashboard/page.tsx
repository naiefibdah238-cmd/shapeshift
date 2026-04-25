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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, name, created_at, inputs')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <DailyQuote />

        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">My plans</h1>
            <p className="text-sm text-muted mt-1">
              {plans?.length ?? 0} saved {plans?.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
          <Link href="/planner" className="btn-primary text-xs px-4 py-2">
            New plan
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-6">Failed to load plans. Refresh to try again.</p>
        )}

        {!plans || plans.length === 0 ? (
          <div className="border border-rule bg-white p-12 text-center">
            <p className="text-sm text-muted mb-4">No plans saved yet.</p>
            <Link href="/planner" className="btn-primary text-xs px-6 py-3">
              Open the planner
            </Link>
          </div>
        ) : (
          <div className="border border-rule divide-y divide-rule">
            {/* Header row */}
            <div className="grid grid-cols-12 px-6 py-3 bg-cream">
              <span className="col-span-5 text-2xs font-semibold tracking-widest uppercase text-muted">Name</span>
              <span className="col-span-3 text-2xs font-semibold tracking-widest uppercase text-muted">Goal</span>
              <span className="col-span-2 text-2xs font-semibold tracking-widest uppercase text-muted">Days</span>
              <span className="col-span-2 text-2xs font-semibold tracking-widest uppercase text-muted">Saved</span>
            </div>

            {(plans as SavedPlan[]).map(plan => (
              <Link
                key={plan.id}
                href={`/plan/${plan.id}`}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-cream transition-colors group"
              >
                <span className="col-span-5 text-sm font-medium text-ink group-hover:text-accent transition-colors truncate pr-4">
                  {plan.name}
                </span>
                <span className="col-span-3 text-sm text-muted">
                  {GOAL_LABELS[plan.inputs?.primaryGoal] ?? plan.inputs?.primaryGoal}
                </span>
                <span className="col-span-2 text-sm text-muted">
                  {plan.inputs?.trainingDays} days/wk
                </span>
                <span className="col-span-2 text-sm text-muted">
                  {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
