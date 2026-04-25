'use client'

import { getDailyQuote } from '@/lib/quotes'

export default function DailyQuote() {
  const quote = getDailyQuote()

  return (
    <div className="relative border-l-2 border-accent pl-6 py-2 mb-10 animate-fade-up">
      <p className="text-base lg:text-lg font-medium text-ink leading-snug tracking-tight">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.author !== 'Unknown' && (
        <p className="text-xs text-muted mt-2 uppercase tracking-widest">— {quote.author}</p>
      )}
    </div>
  )
}
