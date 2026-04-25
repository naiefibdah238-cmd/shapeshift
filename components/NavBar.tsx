'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-rule bg-paper sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink hover:text-accent transition-colors">
          Shape.shift
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/planner"
            className={`text-sm transition-colors ${pathname === '/planner' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
          >
            Planner
          </Link>
          <Link
            href="/nutrition"
            className={`text-sm transition-colors ${pathname === '/nutrition' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
          >
            Nutrition
          </Link>
          <Link
            href="/food-log"
            className={`text-sm transition-colors ${pathname === '/food-log' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
          >
            Food log
          </Link>

          {!loading && (
            user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm transition-colors ${pathname === '/dashboard' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
                >
                  My Plans
                </Link>
                <Link
                  href="/account"
                  className={`text-sm transition-colors ${pathname === '/account' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
                >
                  Account
                </Link>
                <button onClick={handleSignOut} className="text-sm text-muted hover:text-ink transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-xs px-4 py-2">
                  Sign up
                </Link>
              </>
            )
          )}
        </div>
      </nav>
    </header>
  )
}
