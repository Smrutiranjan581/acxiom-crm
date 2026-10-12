'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCrm } from '@/components/providers/crm-provider'
import { STAGES } from '@/lib/constants'
import { formatCompactCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const stageColor: Record<string, string> = {
  Qualification: 'bg-primary',
  Proposal: 'bg-warning',
  Negotiation: 'bg-violet',
  Won: 'bg-success',
  Lost: 'bg-destructive',
}

export function PipelineCard() {
  const { opportunities, scoped } = useCrm()
  const mine = scoped(opportunities)
  const rows = STAGES.map((stage) => {
    const items = mine.filter((o) => o.stage === stage)
    return { stage, count: items.length, amount: items.reduce((s, o) => s + o.amount, 0) }
  })
  const max = Math.max(...rows.map((r) => r.amount), 1)
  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline by stage</CardTitle>
        <CardDescription>{formatCompactCurrency(total)} across {mine.length} opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-5">
          {rows.map((r) => (
            <li key={r.stage} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span aria-hidden className={cn('size-2 rounded-full', stageColor[r.stage])} />
                  {r.stage}
                  <span className="font-normal text-muted-foreground">· {r.count}</span>
                </span>
                <span className="font-medium tabular-nums">{formatCompactCurrency(r.amount)}</span>
              </div>
              <div
                role="meter"
                aria-label={`${r.stage} pipeline value`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((r.amount / max) * 100)}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div className={cn('h-full rounded-full transition-all', stageColor[r.stage])} style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
