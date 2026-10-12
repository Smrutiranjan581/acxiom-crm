import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, followUpsRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'
import type { FollowUp } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const followUps = await followUpsRepo.list(ownerScope)
    return NextResponse.json(followUps)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    const body = await req.json()

    // Server-side validation (Follow-up date cannot be earlier than today for planned/new)
    serverValidation.validateFollowUp(body)

    const newFollowUp: FollowUp = {
      id: body.id || `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subject: body.subject.trim(),
      relatedType: body.relatedType || 'Customer',
      relatedId: body.relatedId,
      date: body.date,
      type: body.type || 'Call',
      status: body.status || 'Planned',
      ownerId: body.ownerId || (session ? session.id : 'u1'),
      notes: body.notes || '',
    }

    const created = await followUpsRepo.create(newFollowUp)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Create',
      entity: 'Follow-Up',
      recordId: created.id,
      newValue: `${created.subject} scheduled for ${created.date}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: error.status })
    }
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
