import { createClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

const CreatePlanSchema = z.object({
  name: z.string().max(100).optional(),
  inputs: z.record(z.string(), z.unknown()),
  schedule: z.array(z.record(z.string(), z.unknown())),
  programming_notes: z.string().max(5000).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('plans')
    .select('id, name, created_at, inputs')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = CreatePlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, inputs, schedule, programming_notes } = parsed.data

  const { data, error } = await supabase
    .from('plans')
    .insert({ user_id: user.id, name: name ?? 'My hybrid week', inputs, schedule, programming_notes })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
