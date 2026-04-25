'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { getDailyQuote } from '@/lib/quotes'

function QuoteBlock() {
  const quote = getDailyQuote()
  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-3">Today&apos;s reminder</p>
      <p className="text-xl lg:text-2xl font-semibold text-white leading-snug tracking-tight">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.author !== 'Unknown' && (
        <p className="text-sm text-white/40 mt-3 uppercase tracking-widest">— {quote.author}</p>
      )}
    </div>
  )
}

export default function LandingPage() {
  useScrollReveal()

  return (
    <div className="flex flex-col min-h-screen bg-ink">
      {/* Quote bar */}
      <div className="bg-stone-950 border-b border-white/10 px-6 py-8 text-center animate-fade-in">
        <QuoteBlock />
      </div>

      {/* Nav */}
      <header className="sticky top-0 left-0 right-0 z-20 animate-fade-in">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-white">Shape.shift</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm border border-white/30 text-white px-4 py-2 hover:bg-white hover:text-ink transition-all duration-200">
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-[8000ms]"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1800&q=80&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/75 to-ink/30" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(-55deg, #C2410C, #C2410C 1px, transparent 1px, transparent 60px)`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase text-accent mb-6 animate-fade-up">
              Hybrid training planner
            </p>
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6 animate-fade-up delay-100">
              Program your<br />
              hybrid week.<br />
              <span className="text-accent">Properly.</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg animate-fade-up delay-200">
              Lift heavy. Run far. Do both without burning out.
            </p>
            <div className="flex flex-wrap items-center gap-4 animate-fade-up delay-300">
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold px-8 py-4 hover:bg-orange-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30"
              >
                Build my week
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link href="/signup" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                Free account →
              </Link>
            </div>

            <div className="mt-14 flex flex-wrap gap-8 animate-fade-up delay-400">
              {['No login required to plan', 'Rules-based, not AI guesswork', 'Built for hybrid athletes'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  <span className="text-xs text-white/50 tracking-wide">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-fade-in delay-800">
          <span className="text-2xs text-white tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white animate-pulse" />
        </div>
      </section>

      {/* What it does */}
      <section className="bg-ink border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
            {[
              {
                num: '01',
                title: 'Interference-aware scheduling',
                body: 'Hard runs never land the day before heavy lower-body work. CNS-intensive sessions never stack back-to-back. Zone 2 acts as a buffer. Every placement has a reason.',
              },
              {
                num: '02',
                title: 'Built for serious hybrid athletes',
                body: "You already know what RPE, zone 2, and deload mean. This tool won't explain a squat to you. It assumes you train hard and need help sequencing, not motivation.",
              },
              {
                num: '03',
                title: 'Just the programming',
                body: 'No AI-generated fluff. No streaks or gamification. No exercise demos. A weekly structure with the reasoning behind each session placement.',
              },
            ].map((card, i) => (
              <div
                key={card.num}
                className="bg-ink p-8 lg:p-10 reveal group hover:bg-stone-950 transition-colors duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-4 group-hover:tracking-[0.2em] transition-all duration-300">{card.num}</p>
                <h3 className="text-base font-semibold text-white mb-3 leading-snug">{card.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split image section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        <div
          className="relative min-h-[300px] lg:min-h-full bg-cover bg-center overflow-hidden group"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-ink/40 group-hover:bg-ink/25 transition-all duration-500" />
          <div className="absolute inset-0 scale-100 group-hover:scale-105 transition-transform duration-700"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        </div>

        <div className="bg-stone-950 flex items-center px-10 lg:px-16 py-16">
          <div className="max-w-md reveal">
            <p className="text-2xs font-bold tracking-widest uppercase text-accent mb-5">How it works</p>
            <div className="space-y-6">
              {[
                { step: '1', text: 'Tell it your goal, training days, lifting style, and endurance volume.' },
                { step: '2', text: 'Get a Mon–Sun grid with sessions placed around your recovery capacity and the interference effect.' },
                { step: '3', text: 'Regenerate for alternatives, swap individual sessions, copy to clipboard or save.' },
              ].map((item, i) => (
                <div key={item.step} className="flex gap-4 reveal" style={{ transitionDelay: `${i * 120}ms` }}>
                  <span className="text-accent font-bold text-sm flex-shrink-0 w-5">{item.step}.</span>
                  <p className="text-sm text-white/70 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 mt-8 bg-accent text-white text-sm font-semibold px-6 py-3 hover:bg-orange-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30"
            >
              Open the planner
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="relative py-24 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1800&q=80&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-ink/85" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center reveal">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            No account needed to start.
          </h2>
          <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
            Build your plan right now. Sign up only when you want to save it.
          </p>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-semibold px-8 py-4 hover:bg-orange-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40"
          >
            Build my week — free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      <div className="bg-ink">
        <Footer dark />
      </div>
    </div>
  )
}
