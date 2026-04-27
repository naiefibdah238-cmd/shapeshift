interface Props {
  message: string
  type: 'success' | 'error'
}

export default function Toast({ message, type }: Props) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 text-sm shadow-xl animate-fade-up whitespace-nowrap ${
      type === 'success' ? 'bg-ink text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? '✓ ' : ''}{message}
    </div>
  )
}
