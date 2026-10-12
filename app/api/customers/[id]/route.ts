import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, customersRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await customersRepo.findById(id)
    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
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
    const existing = await customersRepo.findById(id)

    if (!existing) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    const body = await req.json()

    // Validate with excludeId to allow current customer's existing email/phone
    await serverValidation.validateCustomer(
      {
        name: body.name ?? existing.name,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        company: body.company ?? existing.company,
        status: body.status ?? existing.status,
      },
      id
    )

    const updated = await customersRepo.update(id, body)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Customer',
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

    // Only Admin or Manager can delete
    if (session && session.role === 'SalesExecutive') {
      return NextResponse.json({ message: 'Forbidden: Only Admin and Manager can delete customers' }, { status: 403 })
    }

    const existing = await customersRepo.findById(id)
    if (!existing) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    await customersRepo.delete(id)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Delete',
      entity: 'Customer',
      recordId: id,
      oldValue: `${existing.name} (${existing.code})`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
