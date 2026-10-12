import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, leadsRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const lead = await leadsRepo.findById(id)
    if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    return NextResponse.json(lead)
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
    const existing = await leadsRepo.findById(id)

    if (!existing) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    const body = await req.json()
    serverValidation.validateLead(body)

    const updated = await leadsRepo.update(id, body)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Lead',
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
      return NextResponse.json({ message: 'Forbidden: Only Admin and Manager can delete leads' }, { status: 403 })
    }

    const existing = await leadsRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    await leadsRepo.delete(id)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Delete',
      entity: 'Lead',
      recordId: id,
      oldValue: `${existing.name} (${existing.code})`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
