import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, customersRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'
import type { Customer } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    // If authenticated as SalesExecutive, scope to their own customers
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const customers = await customersRepo.list(ownerScope)
    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Failed to list customers:', error)
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    const body = await req.json()

    // Server-side validation (Section 5 & 17.5)
    await serverValidation.validateCustomer(body)

    const all = await customersRepo.list()
    const nextNum = all.length + 1001

    const newCustomer: Customer = {
      id: body.id || `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: body.code || `CUS-${nextNum}`,
      name: body.name.trim(),
      company: body.company.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      status: body.status || 'Prospect',
      ownerId: body.ownerId || (session ? session.id : 'u1'),
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    }

    const created = await customersRepo.create(newCustomer, session?.id)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Create',
      entity: 'Customer',
      recordId: created.id,
      newValue: `${created.name} (${created.company}) created with code ${created.code}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: error.status })
    }
    console.error('Create customer error:', error)
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
