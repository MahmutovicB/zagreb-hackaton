import { NextResponse } from 'next/server'
import { fetchKindergartens } from '@/lib/datasets'

export const revalidate = 3600

export async function GET() {
  try {
    const kindergartens = await fetchKindergartens()
    return NextResponse.json({ kindergartens, lastUpdated: new Date().toISOString() })
  } catch {
    return NextResponse.json({ kindergartens: [], lastUpdated: new Date().toISOString() }, { status: 500 })
  }
}
