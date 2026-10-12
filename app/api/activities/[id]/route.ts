import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { activitiesRepo, auditLogsRepo } from '@/lib/db/repo'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await activitiesRepo.findById(id)
    if (!item) return NextResponse.json({ message: 'Activity not found' }, { status: 404 })
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
    const existing = await activitiesRepo.findById(id)

    if (!existing) {
      return NextResponse.json({ message: 'Activity not found' }, { status: 404 })
    }

    const body = await req.json()
    const updated = await activitiesRepo.update(id, body)

    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Activity',
      recordId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(updated)
  } catch (error: any) {
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
      return NextResponse.json({ message: 'Forbidden: Only Admin and Manager can delete activities' }, { status: 403 })
    }

    const existing = await activitiesRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'Activity not found' }, { status: 404 })
    }

    await activitiesRepo.delete(id)

    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Delete',
      entity: 'Activity',
      recordId: id,
      oldValue: `${existing.type}: ${existing.subject}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
