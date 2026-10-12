'use client'

import { Label, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useCrm } from '@/components/providers/crm-provider'
import { LEAD_SOURCES } from '@/lib/constants'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']
const key = (s: string) => s.replace(/\s+/g, '').toLowerCase()

const config = Object.fromEntries(
  LEAD_SOURCES.map((s, i) => [key(s), { label: s, color: colors[i] }]),
) satisfies ChartConfig

export function LeadSourceChart() {
  const { leads, scoped } = useCrm()
  const mine = scoped(leads)
  const data = LEAD_SOURCES.map((s) => ({
    source: key(s),
    count: mine.filter((l) => l.source === s).length,
    fill: `var(--color-${key(s)})`,
  })).filter((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead sources</CardTitle>
        <CardDescription>Where your leads come from</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={config} className="mx-auto aspect-square h-48">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="source" hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="source" innerRadius={56} outerRadius={80} strokeWidth={3} paddingAngle={2}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                        {mine.length}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                        Leads
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {data.map((d) => (
            <li key={d.source} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: d.fill }} />
                <span className="truncate text-muted-foreground">{config[d.source]?.label}</span>
              </span>
              <span className="font-medium tabular-nums">{d.count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
