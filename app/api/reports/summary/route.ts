import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { customersRepo, followUpsRepo, leadsRepo, opportunitiesRepo } from '@/lib/db/repo'
import { OPEN_STAGES } from '@/lib/constants'
import { todayISO, weightedValue } from '@/lib/format'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined

    const [customers, leads, opportunities, followUps] = await Promise.all([
      customersRepo.list(ownerScope),
      leadsRepo.list(ownerScope),
      opportunitiesRepo.list(ownerScope),
      followUpsRepo.list(ownerScope),
    ])

    const openLeads = leads.filter((l) => !['Converted', 'Lost', 'Unqualified'].includes(l.status))
    const openOpps = opportunities.filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
    const wonOpps = opportunities.filter((o) => o.stage === 'Won')
    const lostOpps = opportunities.filter((o) => o.stage === 'Lost')

    const totalPipelineValue = openOpps.reduce((s, o) => s + o.amount, 0)
    const weightedPipelineValue = openOpps.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0)

    const today = todayISO()
    const overdueFollowUps = followUps.filter((f) => f.status === 'Planned' && f.date.slice(0, 10) < today).length
    const dueTodayFollowUps = followUps.filter((f) => f.status === 'Planned' && f.date.slice(0, 10) === today).length

    return NextResponse.json({
      totalCustomers: customers.length,
      totalLeads: leads.length,
      openLeads: openLeads.length,
      totalOpportunities: opportunities.length,
      openOpportunities: openOpps.length,
      wonOpportunities: wonOpps.length,
      lostOpportunities: lostOpps.length,
      totalPipelineValue,
      weightedPipelineValue,
      winRate: wonOpps.length + lostOpps.length > 0 ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length)) * 100) : 0,
      overdueFollowUps,
      dueTodayFollowUps,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
