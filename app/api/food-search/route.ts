import { NextRequest, NextResponse } from 'next/server'

const USDA_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  try {
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
    url.searchParams.set('query', q)
    url.searchParams.set('api_key', USDA_KEY)
    url.searchParams.set('dataType', 'Foundation,SR Legacy')
    url.searchParams.set('pageSize', '12')

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    const data = await res.json()

    const results = (data.foods ?? []).map((food: Record<string, unknown>) => {
      const nutrients = (food.foodNutrients as Array<{ nutrientId: number; value: number }>) ?? []
      const get = (id: number) => nutrients.find(n => n.nutrientId === id)?.value ?? 0
      const servingSize = food.servingSize as number | undefined
      const servingSizeUnit = (food.servingSizeUnit as string | undefined)?.toLowerCase()
      const householdServing = food.householdServingFullText as string | undefined
      const servingGrams = servingSize && servingSizeUnit === 'g' ? Math.round(servingSize) : null
      return {
        id: food.fdcId,
        name: (food.description as string)
          .toLowerCase()
          .replace(/\b\w/g, c => c.toUpperCase()),
        per100g: {
          calories: Math.round(get(1008)),
          protein: Math.round(get(1003) * 10) / 10,
          carbs: Math.round(get(1005) * 10) / 10,
          fat: Math.round(get(1004) * 10) / 10,
        },
        servingGrams,
        householdServing: householdServing ?? null,
      }
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
