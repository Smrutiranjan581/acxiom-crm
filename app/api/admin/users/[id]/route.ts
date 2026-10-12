import { NextResponse } from 'next/server'
import { getSessionUser, hashPassword } from '@/lib/auth'
import { auditLogsRepo, usersRepo } from '@/lib/db/repo'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser(req)
    if (session && session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const existing = await usersRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const patch: any = {}

    if (body.name !== undefined) patch.name = body.name
    if (body.email !== undefined) patch.email = body.email
    if (body.phone !== undefined) patch.phone = body.phone
    if (body.role !== undefined) patch.role = body.role
    if (body.active !== undefined) patch.active = body.active

    // Password reset if provided
    if (body.password) {
      patch.passwordHash = await hashPassword(body.password)
    }

    // Unlock account if requested
    if (body.unlock) {
      await usersRepo.unlock(id)
    }

    const updated = await usersRepo.update(id, patch)

    // Audit log
    const changes: string[] = []
    if (body.role && body.role !== existing.role) changes.push(`Role changed from ${existing.role} to ${body.role}`)
    if (body.active !== undefined && body.active !== existing.active) changes.push(`Status changed to ${body.active ? 'Active' : 'Inactive'}`)
    if (body.password) changes.push('Password was reset')
    if (body.unlock) changes.push('Account was unlocked')

    await auditLogsRepo.create({
      userId: session?.id || 'admin',
      action: body.role !== existing.role ? 'Role Change' : 'Update',
      entity: 'User',
      recordId: id,
      oldValue: JSON.stringify(existing),
      newValue: changes.join('; ') || 'User profile updated',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
