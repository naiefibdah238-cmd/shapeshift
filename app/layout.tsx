import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shape.shift — Hybrid Training Planner',
  description: 'Program your hybrid week. Properly. For athletes who lift and train endurance.',
  openGraph: {
    title: 'Shape.shift',
    description: 'Program your hybrid week. Properly.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
