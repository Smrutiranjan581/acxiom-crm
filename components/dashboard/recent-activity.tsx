'use client'

import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/crm/status-badge'
import { activityIcon } from '@/components/dashboard/upcoming-follow-ups'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDateTime } from '@/lib/format'

export function RecentActivity() {
  const { activities, scoped, userName, relatedName } = useCrm()
  const items = [...scoped(activities)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest calls, meetings and tasks</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/activities" />} nativeButton={false}>
            View all
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity logged yet.
          </div>
        ) : (
          <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
          {items.map((a) => {
            const Icon = activityIcon[a.type]
            return (
              <li key={a.id} className="relative flex gap-3">
                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-medium">{a.subject}</span>
                    <StatusBadge status={a.status} className="shrink-0" />
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {userName(a.ownerId)} · {relatedName(a.relatedType, a.relatedId)} · {formatDateTime(a.date)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
        )}
      </CardContent>
    </Card>
  )
}
