import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, opportunitiesRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'
import type { Opportunity } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const opportunities = await opportunitiesRepo.list(ownerScope)
    return NextResponse.json(opportunities)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    const body = await req.json()

    // Server-side validation (Amount > 0, Probability 0-100, close date not in past)
    serverValidation.validateOpportunity(body)

    const newOpp: Opportunity = {
      id: body.id || `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: body.name.trim(),
      customerId: body.customerId,
      leadId: body.leadId || undefined,
      amount: Number(body.amount),
      stage: body.stage || 'Qualification',
      probability: Number(body.probability) || 20,
      expectedCloseDate: body.expectedCloseDate,
      ownerId: body.ownerId || (session ? session.id : 'u1'),
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    }

    const created = await opportunitiesRepo.create(newOpp)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Create',
      entity: 'Opportunity',
      recordId: created.id,
      newValue: `${created.name} (Amount: $${created.amount}, Stage: ${created.stage})`,
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
