import { NextResponse } from 'next/server'
import { getSessionUser, hashPassword } from '@/lib/auth'
import { auditLogsRepo, usersRepo } from '@/lib/db/repo'
import type { Role, User } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    if (session && session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const users = await usersRepo.list()
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    if (session && session.role !== 'Admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 })
    }

    const existing = await usersRepo.findByEmail(body.email)
    if (existing) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(body.password)
    const newUser: User = {
      id: body.id || `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      role: (body.role as Role) || 'SalesExecutive',
      active: body.active !== undefined ? body.active : true,
      lockedOut: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    const created = await usersRepo.create(newUser, passwordHash)

    await auditLogsRepo.create({
      userId: session?.id || 'admin',
      action: 'Create',
      entity: 'User',
      recordId: created.id,
      newValue: `Created user ${created.name} (${created.email}) with role ${created.role}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
