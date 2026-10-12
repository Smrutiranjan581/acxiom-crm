import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo } from '@/lib/db/repo'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    // Managers can have limited view, Admin has full view
    if (session && session.role === 'SalesExecutive') {
      return NextResponse.json({ message: 'Forbidden: Audit log access requires Admin or Manager role' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const entity = searchParams.get('entity') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100

    const logs = await auditLogsRepo.list({ userId, action, entity, limit })
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
