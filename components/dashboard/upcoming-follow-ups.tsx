'use client'

import Link from 'next/link'
import { ArrowRightIcon, CalendarCheck2Icon, MailIcon, PhoneIcon, UsersIcon, CheckSquareIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDateTime, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'

export const activityIcon = { Call: PhoneIcon, Meeting: UsersIcon, Email: MailIcon, Task: CheckSquareIcon } as const

export function UpcomingFollowUps() {
  const { followUps, scoped, relatedName } = useCrm()
  const today = todayISO()
  const items = scoped(followUps)
    .filter((f) => f.status === 'Planned')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming follow-ups</CardTitle>
        <CardDescription>Planned touchpoints, soonest first</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/follow-ups" />} nativeButton={false}>
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarCheck2Icon />
              </EmptyMedia>
              <EmptyTitle>All caught up</EmptyTitle>
              <EmptyDescription>No planned follow-ups right now.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((f) => {
              const Icon = activityIcon[f.type]
              const overdue = f.date.slice(0, 10) < today
              return (
                <li key={f.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{f.subject}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {relatedName(f.relatedType, f.relatedId)} · {formatDateTime(f.date)}
                    </span>
                  </div>
                  {overdue ? <StatusBadge status="Missed" label="Overdue" /> : <StatusBadge status={f.type === 'Meeting' ? 'Negotiation' : 'Planned'} label={f.type} dot={false} />}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
