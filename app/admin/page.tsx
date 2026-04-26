'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  plan_count: number
  days_logged: number
  avg_calories: number
  avg_protein: number
  last_food_date: string | null
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          router.push('/dashboard')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        if (data.error) { setError(data.error); setLoading(false); return }
        setUsers(data.users)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load users.'); setLoading(false) })
  }, [])

  const filtered = users.filter(u =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPlans = users.reduce((a, u) => a + u.plan_count, 0)
  const activeUsers = users.filter(u => u.days_logged > 0).length

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
          <p className="text-sm text-muted">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-1">Admin</p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">User overview</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px bg-rule border border-rule mb-10">
          {[
            { label: 'Total users', value: users.length },
            { label: 'Total plans saved', value: totalPlans },
            { label: 'Users with food logs', value: activeUsers },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-5 py-5">
              <p className="text-2xs font-semibold tracking-widest uppercase text-muted mb-1">{stat.label}</p>
              <p className="text-3xl font-bold tracking-tight text-ink">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="input-field max-w-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        {/* User table */}
        <div className="border border-rule divide-y divide-rule overflow-x-auto">
          <div className="grid px-6 py-3 bg-cream min-w-[860px]" style={{ gridTemplateColumns: '3fr 1.5fr 1.5fr 0.8fr 1fr 1fr 1fr' }}>
            {['Email', 'Joined', 'Last sign-in', 'Plans', 'Food days', 'Avg kcal', 'Avg protein'].map(h => (
              <span key={h} className="text-2xs font-semibold tracking-widest uppercase text-muted">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted">No users found.</div>
          ) : (
            filtered.map(u => (
              <div
                key={u.id}
                className="grid px-6 py-4 items-center hover:bg-cream transition-colors min-w-[860px]"
                style={{ gridTemplateColumns: '3fr 1.5fr 1.5fr 0.8fr 1fr 1fr 1fr' }}
              >
                <span className="text-sm text-ink truncate pr-4">{u.email ?? '—'}</span>
                <span className="text-sm text-muted">{fmt(u.created_at)}</span>
                <span className="text-sm text-muted">{fmt(u.last_sign_in_at)}</span>
                <span className="text-sm text-muted">{u.plan_count}</span>
                <span className="text-sm text-muted">{u.days_logged > 0 ? `${u.days_logged} days` : '—'}</span>
                <span className="text-sm text-muted">{u.avg_calories > 0 ? u.avg_calories.toLocaleString() : '—'}</span>
                <span className="text-sm text-muted">{u.avg_protein > 0 ? `${u.avg_protein}g` : '—'}</span>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
