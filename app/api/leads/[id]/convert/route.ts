import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { auditLogsRepo, customersRepo, leadsRepo, opportunitiesRepo } from '@/lib/db/repo'
import type { Customer, Opportunity } from '@/types'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionUser(req)
    const lead = await leadsRepo.findById(id)

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    if (lead.status === 'Converted') {
      return NextResponse.json({ message: 'Lead is already converted' }, { status: 400 })
    }

    const customers = await customersRepo.list()
    const nextCode = `CUS-${customers.length + 1001}`
    const customerId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    // 1. Create Customer
    const newCustomer: Customer = {
      id: customerId,
      code: nextCode,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone || '+91 00000 00000',
      address: '',
      city: '—',
      state: '—',
      status: 'Active',
      ownerId: lead.ownerId,
      notes: `Converted from lead ${lead.code}`,
      createdAt: new Date().toISOString(),
    }
    const createdCustomer = await customersRepo.create(newCustomer, session?.id)

    // 2. Create Opportunity
    const oppId = `o-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const closeDate = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
    const newOpp: Opportunity = {
      id: oppId,
      name: `${lead.company} — New deal`,
      customerId: createdCustomer.id,
      leadId: lead.id,
      stage: 'Qualification',
      amount: lead.expectedValue > 0 ? lead.expectedValue : 100000,
      probability: 20,
      expectedCloseDate: closeDate,
      ownerId: lead.ownerId,
      notes: `Originated from lead conversion (${lead.code})`,
      createdAt: new Date().toISOString(),
    }
    const createdOpp = await opportunitiesRepo.create(newOpp)

    // 3. Update Lead Status to Converted
    await leadsRepo.update(id, { status: 'Converted' })

    // 4. Audit Log
    await auditLogsRepo.create({
      userId: session?.id || 'system',
      action: 'Update',
      entity: 'Lead',
      recordId: lead.id,
      oldValue: `Status: ${lead.status}`,
      newValue: `Lead converted to Customer ${createdCustomer.code} and Opportunity ${createdOpp.name}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({
      message: 'Lead converted successfully',
      customer: createdCustomer,
      opportunity: createdOpp,
    })
  } catch (error: any) {
    console.error('Lead conversion error:', error)
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
