import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { opportunitiesRepo } from '@/lib/db/repo'
import { OPEN_STAGES, STAGES } from '@/lib/constants'
import { weightedValue } from '@/lib/format'

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req)
    const ownerScope = session && session.role === 'SalesExecutive' ? session.id : undefined
    const opportunities = await opportunitiesRepo.list(ownerScope)

    const stageBreakdown = STAGES.map((stage) => {
      const items = opportunities.filter((o) => o.stage === stage)
      const count = items.length
      const totalAmount = items.reduce((s, o) => s + o.amount, 0)
      const weightedAmount = items.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0)
      return { stage, count, totalAmount, weightedAmount }
    })

    const openOpps = opportunities.filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
    const totalPipeline = openOpps.reduce((s, o) => s + o.amount, 0)
    const totalWeighted = openOpps.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0)

    return NextResponse.json({
      totalPipeline,
      totalWeighted,
      openCount: openOpps.length,
      stages: stageBreakdown,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
