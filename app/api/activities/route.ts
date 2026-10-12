import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { activitiesRepo, auditLogsRepo } from '@/lib/db/repo'
import type { Activity } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const activities = await activitiesRepo.list(ownerScope)
    return NextResponse.json(activities)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    const body = await req.json()

    if (!body.subject || body.subject.trim() === '') {
      return NextResponse.json({ message: 'Activity subject is required' }, { status: 400 })
    }

    const newActivity: Activity = {
      id: body.id || `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: body.type || 'Call',
      subject: body.subject.trim(),
      relatedType: body.relatedType || 'Customer',
      relatedId: body.relatedId || 'c1',
      date: body.date || new Date().toISOString(),
      status: body.status || 'Pending',
      ownerId: body.ownerId || (session ? session.id : 'u1'),
      description: body.description || '',
    }

    const created = await activitiesRepo.create(newActivity)

    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Create',
      entity: 'Activity',
      recordId: created.id,
      newValue: `${created.type}: ${created.subject}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
