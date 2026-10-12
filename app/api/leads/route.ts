import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, leadsRepo } from '@/lib/db/repo'
import { serverValidation, ValidationError } from '@/lib/server-validation'
import type { Lead } from '@/types'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const leads = await leadsRepo.list(ownerScope)
    return NextResponse.json(leads)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req)
    const body = await req.json()

    // Server-side validation (Section 5 & 17.6)
    serverValidation.validateLead(body)

    const all = await leadsRepo.list()
    const nextNum = all.length + 2001

    const newLead: Lead = {
      id: body.id || `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: body.code || `LD-${nextNum}`,
      name: body.name.trim(),
      company: body.company.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || '',
      source: body.source || 'Website',
      status: body.status || 'New',
      priority: body.priority || 'Medium',
      expectedValue: Number(body.expectedValue) || 0,
      ownerId: body.ownerId || (session ? session.id : 'u1'),
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    }

    const created = await leadsRepo.create(newLead)

    // Audit log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Create',
      entity: 'Lead',
      recordId: created.id,
      newValue: `${created.name} (${created.company}) created with code ${created.code}`,
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
