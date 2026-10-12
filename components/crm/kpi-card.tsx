import { TrendingDownIcon, TrendingUpIcon, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const tones = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
  amber: 'bg-warning/10 text-warning',
  violet: 'bg-violet/10 text-violet',
  red: 'bg-destructive/10 text-destructive',
} as const

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  change,
  hint,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: keyof typeof tones
  change?: number
  hint?: string
}) {
  const positive = (change ?? 0) >= 0
  return (
    <Card className="shadow-xs">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
            <Icon className="size-4.5" aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <div className="flex items-center gap-1.5 text-xs">
            {change !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  positive ? 'text-success' : 'text-destructive',
                )}
              >
                {positive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
                {positive ? '+' : ''}
                {change}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
