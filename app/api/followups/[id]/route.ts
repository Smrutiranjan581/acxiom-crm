import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, followUpsRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await followUpsRepo.findById(id)
    if (!item) return NextResponse.json({ message: 'Follow-up not found' }, { status: 404 })
    return NextResponse.json(item)
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
    const existing = await followUpsRepo.findById(id)

    if (!existing) {
      return NextResponse.json({ message: 'Follow-up not found' }, { status: 404 })
    }

    const body = await req.json()
    if (body.subject || body.date) {
      serverValidation.validateFollowUp({
        subject: body.subject ?? existing.subject,
        date: body.date ?? existing.date,
        status: body.status ?? existing.status,
      })
    }

    const updated = await followUpsRepo.update(id, body)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Follow-Up',
      recordId: id,
      oldValue: `Status: ${existing.status}, Date: ${existing.date}`,
      newValue: `Status: ${updated?.status}, Date: ${updated?.date}`,
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
      return NextResponse.json({ message: 'Forbidden: Only Admin and Manager can delete follow-ups' }, { status: 403 })
    }

    const existing = await followUpsRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'Follow-up not found' }, { status: 404 })
    }

    await followUpsRepo.delete(id)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Delete',
      entity: 'Follow-Up',
      recordId: id,
      oldValue: `${existing.subject}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({ message: 'Follow-up deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
