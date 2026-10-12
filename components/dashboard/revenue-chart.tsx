'use client'

import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useCrm } from '@/components/providers/crm-provider'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'

const config = {
  won: { label: 'Won revenue', color: 'var(--chart-1)' },
  target: { label: 'Target', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function RevenueChart() {
  const { opportunities, scoped } = useCrm()
  const myOpps = scoped(opportunities)
  const wonOpps = myOpps.filter((o) => o.stage === 'Won')
  const total = wonOpps.reduce((s, o) => s + o.amount, 0)

  // Last 6 months dynamically calculated
  const now = new Date()
  const monthNames: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthNames.push(d.toLocaleString('default', { month: 'short' }))
  }

  const data = monthNames.map((m) => {
    const matching = wonOpps.filter((o) => {
      const d = new Date(o.createdAt || o.expectedCloseDate)
      return d.toLocaleString('default', { month: 'short' }) === m
    })
    const won = matching.reduce((s, o) => s + o.amount, 0)
    return {
      month: m,
      won,
      target: won > 0 ? Math.round(won * 1.15) : 0,
    }
  })

  const target = data.reduce((s, m) => s + m.target, 0)
  const pct = target > 0 ? Math.round((total / target) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue performance</CardTitle>
        <CardDescription>Won deals vs. monthly target · last 6 months</CardDescription>
        <CardAction>
          <Badge variant="secondary" className="tabular-nums">
            {pct}% of target
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(total)}</span>
          <span className="text-sm text-muted-foreground">closed won</span>
        </div>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-won)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-won)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => formatCompactCurrency(v)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label}</span>
                  <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
                </div>
              )} />}
            />
            <Area dataKey="won" type="monotone" stroke="var(--color-won)" strokeWidth={2} fill="url(#fillWon)" />
            <Line dataKey="target" type="monotone" stroke="var(--color-target)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
