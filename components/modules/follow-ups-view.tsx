'use client'

import { AlarmClockIcon, CalendarCheckIcon, CalendarClockIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { CrudPage } from '@/components/crm/crud-page'
import { KpiCard } from '@/components/crm/kpi-card'
import { StatusBadge } from '@/components/crm/status-badge'
import { PersonCell } from '@/components/crm/person-cell'
import { activityIcon } from '@/components/dashboard/upcoming-follow-ups'
import { toOptions } from '@/components/forms/app-select'
import { useCrm } from '@/components/providers/crm-provider'
import { splitRelated, useRelatedOptions } from '@/components/modules/use-related-options'
import { ACTIVITY_TYPES, FOLLOW_UP_STATUSES } from '@/lib/constants'
import { formatDateTime, todayISO } from '@/lib/format'
import { includesQ, newId, toLocalInput, userOptions } from '@/lib/form-helpers'
import type { ActivityType, FollowUp, FollowUpStatus } from '@/types'

export function FollowUpsView({ openNew }: { openNew?: boolean }) {
  const { followUps, users, scoped, userName, relatedName, create, update, remove, can, currentUser } = useCrm()
  const relatedOptions = useRelatedOptions()
  const rows = scoped(followUps)
  const today = todayISO()
  const planned = rows.filter((f) => f.status === 'Planned')
  const overdue = planned.filter((f) => f.date.slice(0, 10) < today)

  return (
    <CrudPage<FollowUp>
      title="Follow-Ups"
      description="Schedule and track every next step with customers and prospects."
      singular="Follow-up"
      rows={rows}
      openNew={openNew}
      canDelete={can('Admin', 'Manager')}
      searchPlaceholder="Search follow-ups…"
      searchFn={(f, q) => includesQ(q, f.subject, relatedName(f.relatedType, f.relatedId))}
      filters={[
        { id: 'status', label: 'Status', options: FOLLOW_UP_STATUSES, getValue: (f) => f.status },
        { id: 'type', label: 'Type', options: ACTIVITY_TYPES, getValue: (f) => f.type },
      ]}
      extraActions={(f) =>
        f.status === 'Planned'
          ? [
              { label: 'Mark completed', icon: CheckCircle2Icon, onClick: () => update('followUps', f.id, { status: 'Completed' }) },
              { label: 'Mark missed', icon: XCircleIcon, onClick: () => update('followUps', f.id, { status: 'Missed' }) },
            ]
          : []
      }
      summary={
        <section aria-label="Follow-up summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Planned" value={planned.length} icon={CalendarClockIcon} tone="blue" />
          <KpiCard label="Due today" value={planned.filter((f) => f.date.slice(0, 10) === today).length} icon={AlarmClockIcon} tone="amber" />
          <KpiCard label="Overdue" value={overdue.length} icon={XCircleIcon} tone="red" />
          <KpiCard label="Completed" value={rows.filter((f) => f.status === 'Completed').length} icon={CalendarCheckIcon} tone="green" />
        </section>
      }
      columns={[
        {
          id: 'subject',
          header: 'Subject',
          sortValue: (f) => f.subject,
          cell: (f) => {
            const Icon = activityIcon[f.type]
            return (
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{f.subject}</span>
                  <span className="text-xs text-muted-foreground">{f.type}</span>
                </div>
              </div>
            )
          },
        },
        {
          id: 'related',
          header: 'Related to',
          className: 'hidden md:table-cell',
          sortValue: (f) => relatedName(f.relatedType, f.relatedId),
          cell: (f) => (
            <div className="flex flex-col">
              <span>{relatedName(f.relatedType, f.relatedId)}</span>
              <span className="text-xs text-muted-foreground">{f.relatedType}</span>
            </div>
          ),
        },
        {
          id: 'date',
          header: 'Scheduled',
          sortValue: (f) => f.date,
          cell: (f) => {
            const late = f.status === 'Planned' && f.date.slice(0, 10) < today
            return <span className={late ? 'font-medium text-destructive' : 'text-muted-foreground'}>{formatDateTime(f.date)}</span>
          },
        },
        {
          id: 'status',
          header: 'Status',
          sortValue: (f) => f.status,
          cell: (f) =>
            f.status === 'Planned' && f.date.slice(0, 10) < today ? <StatusBadge status="Missed" label="Overdue" /> : <StatusBadge status={f.status} />,
        },
        { id: 'owner', header: 'Owner', className: 'hidden xl:table-cell', sortValue: (f) => userName(f.ownerId), cell: (f) => <PersonCell name={userName(f.ownerId)} size="sm" /> },
      ]}
      fields={[
        { name: 'subject', label: 'Subject', required: true, full: true },
        { name: 'related', label: 'Related to', type: 'select', required: true, full: true, options: relatedOptions },
        { name: 'type', label: 'Type', type: 'select', required: true, options: toOptions(ACTIVITY_TYPES) },
        { name: 'status', label: 'Status', type: 'select', required: true, options: toOptions(FOLLOW_UP_STATUSES) },
        {
          name: 'date',
          label: 'Date & time',
          type: 'datetime-local',
          required: true,
          validate: (v, values) =>
            !['Completed', 'Missed', 'Cancelled'].includes(values.status) && v && v.slice(0, 10) < todayISO()
              ? 'Follow-up date cannot be earlier than today'
              : undefined,
        },
        { name: 'ownerId', label: 'Owner', type: 'select', required: true, options: userOptions(users) },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      toForm={(f) => ({
        subject: f?.subject ?? '',
        related: f ? `${f.relatedType}:${f.relatedId}` : '',
        type: f?.type ?? 'Call',
        status: f?.status ?? 'Planned',
        date: f ? toLocalInput(f.date) : '',
        ownerId: f?.ownerId ?? currentUser.id,
        notes: f?.notes ?? '',
      })}
      onSave={(v, existing) => {
        const patch = {
          subject: v.subject,
          ...splitRelated(v.related),
          type: v.type as ActivityType,
          status: v.status as FollowUpStatus,
          date: new Date(v.date).toISOString(),
          ownerId: v.ownerId,
          notes: v.notes,
        }
        if (existing) update('followUps', existing.id, patch)
        else create('followUps', { ...patch, id: newId('f') })
      }}
      onDelete={(f) => remove('followUps', f.id)}
    />
  )
}
