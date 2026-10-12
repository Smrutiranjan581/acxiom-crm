import { NextResponse } from 'next/server'
import { initDb, isNeonConfigured } from '@/lib/db'

export async function GET() {
  const neonConfigured = isNeonConfigured()
  const dbUrl = process.env.DATABASE_URL
  const maskedUrl = dbUrl
    ? dbUrl.replace(/:([^:@]+)@/, ':****@')
    : 'Not configured (using local storage mode)'

  return NextResponse.json({
    neonConfigured,
    databaseUrl: maskedUrl,
    mode: neonConfigured ? 'Neon PostgreSQL (Connected)' : 'Local Storage Mode',
    instruction: neonConfigured
      ? 'Neon PostgreSQL is active.'
      : 'Set DATABASE_URL in .env.local to your Neon Postgres connection string.',
  })
}

export async function POST() {
  try {
    const res = await initDb()
    return NextResponse.json(res)
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
