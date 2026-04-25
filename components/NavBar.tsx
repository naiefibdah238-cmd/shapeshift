'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/planner',   label: 'Planner' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/food-log',  label: 'Food log' },
]

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
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

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const allLinks = [
    ...NAV_LINKS,
    ...(user ? [
      { href: '/dashboard', label: 'My Plans' },
      { href: '/account',   label: 'Account' },
    ] : []),
  ]

  return (
    <>
      <header className="border-b border-rule bg-paper sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-ink hover:text-accent transition-colors">
            Shape.shift
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors ${pathname === l.href ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
              >
                {l.label}
              </Link>
            ))}

            {!loading && (
              user ? (
                <>
                  <Link href="/dashboard" className={`text-sm transition-colors ${pathname === '/dashboard' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}>
                    My Plans
                  </Link>
                  <Link href="/account" className={`text-sm transition-colors ${pathname === '/account' ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}>
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>
      </header>

      {/* Mobile menu drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 flex flex-col" style={{ top: '57px' }}>
          <div className="bg-paper border-b border-rule flex-shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col divide-y divide-rule">
              {allLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`py-3.5 text-sm font-medium transition-colors ${pathname === l.href ? 'text-accent' : 'text-ink hover:text-accent'}`}
                >
                  {l.label}
                </Link>
              ))}

              {!loading && (
                user ? (
                  <button
                    onClick={handleSignOut}
                    className="py-3.5 text-sm font-medium text-muted hover:text-ink transition-colors text-left"
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex gap-3 pt-4 pb-2">
                    <Link href="/login" className="flex-1 btn-secondary text-sm py-3 text-center">
                      Sign in
                    </Link>
                    <Link href="/signup" className="flex-1 btn-primary text-sm py-3 text-center">
                      Sign up
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-ink/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
