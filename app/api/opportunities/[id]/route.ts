import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, opportunitiesRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const opp = await opportunitiesRepo.findById(id)
    if (!opp) return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 })
    return NextResponse.json(opp)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser(req)
    const existing = await opportunitiesRepo.findById(id)

    if (!existing) {
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 })
    }

    const body = await req.json()
    serverValidation.validateOpportunity({
      name: body.name ?? existing.name,
      amount: body.amount ?? existing.amount,
      probability: body.probability ?? existing.probability,
      expectedCloseDate: body.expectedCloseDate ?? existing.expectedCloseDate,
      stage: body.stage ?? existing.stage,
    })

    const updated = await opportunitiesRepo.update(id, body)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Opportunity',
      recordId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: error.status })
    }
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser(req)

    if (session && session.role === 'SalesExecutive') {
      return NextResponse.json({ message: 'Forbidden: Only Admin and Manager can delete opportunities' }, { status: 403 })
    }

    const existing = await opportunitiesRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'Opportunity not found' }, { status: 404 })
    }

    await opportunitiesRepo.delete(id)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Delete',
      entity: 'Opportunity',
      recordId: id,
      oldValue: `${existing.name} (Amount: $${existing.amount})`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({ message: 'Opportunity deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
