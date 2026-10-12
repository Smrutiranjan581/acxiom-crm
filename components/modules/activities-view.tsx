'use client'

import { CheckSquareIcon, MailIcon, PhoneIcon, UsersIcon } from 'lucide-react'
import { CrudPage } from '@/components/crm/crud-page'
import { KpiCard } from '@/components/crm/kpi-card'
import { StatusBadge } from '@/components/crm/status-badge'
import { PersonCell } from '@/components/crm/person-cell'
import { activityIcon } from '@/components/dashboard/upcoming-follow-ups'
import { toOptions } from '@/components/forms/app-select'
import { useCrm } from '@/components/providers/crm-provider'
import { splitRelated, useRelatedOptions } from '@/components/modules/use-related-options'
import { ACTIVITY_STATUSES, ACTIVITY_TYPES } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import { includesQ, newId, toLocalInput, userOptions } from '@/lib/form-helpers'
import type { Activity, ActivityStatus, ActivityType } from '@/types'

export function ActivitiesView({ openNew }: { openNew?: boolean }) {
  const { activities, users, scoped, userName, relatedName, create, update, remove, can, currentUser } = useCrm()
  const relatedOptions = useRelatedOptions()
  const rows = scoped(activities)
  const count = (t: ActivityType) => rows.filter((a) => a.type === t).length

  return (
    <CrudPage<Activity>
      title="Activities"
      description="A complete log of calls, meetings, emails and tasks."
      singular="Activity"
      rows={rows}
      openNew={openNew}
      canDelete={can('Admin', 'Manager')}
      searchPlaceholder="Search activities…"
      searchFn={(a, q) => includesQ(q, a.subject, a.description, relatedName(a.relatedType, a.relatedId))}
      filters={[
        { id: 'type', label: 'Type', options: ACTIVITY_TYPES, getValue: (a) => a.type },
        { id: 'status', label: 'Status', options: ACTIVITY_STATUSES, getValue: (a) => a.status },
      ]}
      summary={
        <section aria-label="Activity summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Calls" value={count('Call')} icon={PhoneIcon} tone="blue" />
          <KpiCard label="Meetings" value={count('Meeting')} icon={UsersIcon} tone="violet" />
          <KpiCard label="Emails" value={count('Email')} icon={MailIcon} tone="amber" />
          <KpiCard label="Tasks" value={count('Task')} icon={CheckSquareIcon} tone="green" />
        </section>
      }
      columns={[
        {
          id: 'subject',
          header: 'Activity',
          sortValue: (a) => a.subject,
          cell: (a) => {
            const Icon = activityIcon[a.type]
            return (
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{a.subject}</span>
                  <span className="max-w-xs truncate text-xs text-muted-foreground">{a.description || a.type}</span>
                </div>
              </div>
            )
          },
        },
        { id: 'related', header: 'Related to', className: 'hidden md:table-cell', sortValue: (a) => relatedName(a.relatedType, a.relatedId), cell: (a) => <span className="text-muted-foreground">{relatedName(a.relatedType, a.relatedId)}</span> },
        { id: 'date', header: 'Date', sortValue: (a) => a.date, cell: (a) => <span className="text-muted-foreground">{formatDateTime(a.date)}</span> },
        { id: 'status', header: 'Status', sortValue: (a) => a.status, cell: (a) => <StatusBadge status={a.status} /> },
        { id: 'owner', header: 'Owner', className: 'hidden xl:table-cell', sortValue: (a) => userName(a.ownerId), cell: (a) => <PersonCell name={userName(a.ownerId)} size="sm" /> },
      ]}
      fields={[
        { name: 'subject', label: 'Subject', required: true, full: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: toOptions(ACTIVITY_TYPES) },
        { name: 'status', label: 'Status', type: 'select', required: true, options: toOptions(ACTIVITY_STATUSES) },
        { name: 'related', label: 'Related to', type: 'select', required: true, full: true, options: relatedOptions },
        { name: 'date', label: 'Date & time', type: 'datetime-local', required: true },
        { name: 'ownerId', label: 'Owner', type: 'select', required: true, options: userOptions(users) },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      toForm={(a) => ({
        subject: a?.subject ?? '',
        type: a?.type ?? 'Call',
        status: a?.status ?? 'Pending',
        related: a ? `${a.relatedType}:${a.relatedId}` : '',
        date: a ? toLocalInput(a.date) : toLocalInput(new Date().toISOString()),
        ownerId: a?.ownerId ?? currentUser.id,
        description: a?.description ?? '',
      })}
      onSave={(v, existing) => {
        const patch = {
          subject: v.subject,
          type: v.type as ActivityType,
          status: v.status as ActivityStatus,
          ...splitRelated(v.related),
          date: new Date(v.date).toISOString(),
          ownerId: v.ownerId,
          description: v.description,
        }
        if (existing) update('activities', existing.id, patch)
        else create('activities', { ...patch, id: newId('a') })
      }}
      onDelete={(a) => remove('activities', a.id)}
    />
  )
}
