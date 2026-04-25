import Link from 'next/link'

export default function Footer({ dark = false }: { dark?: boolean }) {
  const text = dark ? 'text-white/40' : 'text-muted'
  const hover = dark ? 'hover:text-white/70' : 'hover:text-ink'
  const border = dark ? 'border-white/10' : 'border-rule'

  return (
    <footer className={`border-t ${border} mt-auto`}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <span className={`text-xs ${text}`}>Shape.shift</span>
        <div className="flex items-center gap-6">
          <Link href="/planner" className={`text-xs ${text} ${hover} transition-colors`}>Planner</Link>
          <a href="mailto:hello@shapeshift.app" className={`text-xs ${text} ${hover} transition-colors`}>Contact</a>
          <span className={`text-xs ${text}`}>Terms</span>
        </div>
      </div>
    </footer>
  )
}
