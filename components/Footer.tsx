import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-rule mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted">
        <span>Shape.shift</span>
        <div className="flex items-center gap-6">
          <Link href="/planner" className="hover:text-ink transition-colors">Planner</Link>
          <a href="mailto:hello@shapeshift.app" className="hover:text-ink transition-colors">Contact</a>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  )
}
