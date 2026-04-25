import Link from 'next/link'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b border-rule">
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-ink">Shape.shift</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="btn-secondary text-xs px-4 py-2">
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-6">
              Hybrid training planner
            </p>
            <h1 className="text-4xl lg:text-5xl font-semibold text-ink leading-tight tracking-tight mb-6">
              Program your hybrid week.<br />
              Properly.
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-10 max-w-xl">
              For athletes who lift and run — not beginners looking for motivation, and not lifters who jog once a month.
              Structure your training week around real interference principles, not guesswork.
            </p>
            <Link href="/planner" className="btn-primary text-sm px-8 py-4">
              Open the planner
            </Link>
          </div>
        </section>

        {/* Rule line */}
        <div className="border-t border-rule" />

        {/* What it does */}
        <section className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-rule divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="px-8 py-10">
              <p className="text-2xs font-semibold tracking-widest uppercase text-accent mb-4">
                01 — What it does
              </p>
              <h3 className="text-base font-semibold text-ink mb-3 leading-tight">
                Generates a weekly schedule built around interference management
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Tell it your goal, training days, lifting style, and endurance volume. It produces a Mon–Sun grid
                with each session positioned to respect recovery, CNS load, and the interference effect between
                lifting and cardio. Every placement has a one-line reason.
              </p>
            </div>

            <div className="px-8 py-10">
              <p className="text-2xs font-semibold tracking-widest uppercase text-accent mb-4">
                02 — Who it&apos;s for
              </p>
              <h3 className="text-base font-semibold text-ink mb-3 leading-tight">
                Hybrid athletes with a year or more of training experience
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                If you already know what RPE, zone 2, and deload mean — and you&apos;re trying to
                do both intelligently rather than just bolting cardio onto a lifting program — this is built
                for you. It won&apos;t explain what a squat is.
              </p>
            </div>

            <div className="px-8 py-10">
              <p className="text-2xs font-semibold tracking-widest uppercase text-accent mb-4">
                03 — What it won&apos;t do
              </p>
              <h3 className="text-base font-semibold text-ink mb-3 leading-tight">
                No nutrition, no demos, no progress tracking, no motivation
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                No calorie targets. No exercise videos. No streaks. No &ldquo;you&apos;ve got this&rdquo;.
                Just the programming structure — which sessions go where, and why. Use your own training app
                for logging. Use your own coach for periodization.
              </p>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="border-t border-rule bg-ink text-white">
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold">No account required to use the planner.</p>
              <p className="text-sm text-white/60 mt-1">
                Generate a plan, copy it, and go train. Sign up only when you want to save plans.
              </p>
            </div>
            <Link href="/planner" className="btn-primary bg-white text-ink hover:bg-accent hover:text-white flex-shrink-0 text-sm px-8 py-4">
              Open the planner
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
