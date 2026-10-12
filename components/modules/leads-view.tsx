'use client'

import { ArrowRightLeftIcon, FlameIcon, SparklesIcon, TargetIcon, WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CrudPage } from '@/components/crm/crud-page'
import { KpiCard } from '@/components/crm/kpi-card'
import { PersonCell } from '@/components/crm/person-cell'
import { StatusBadge } from '@/components/crm/status-badge'
import { Badge } from '@/components/ui/badge'
import { toOptions } from '@/components/forms/app-select'
import { useCrm } from '@/components/providers/crm-provider'
import { LEAD_SOURCES, LEAD_STATUSES, PRIORITIES } from '@/lib/constants'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import { includesQ, newId, userOptions } from '@/lib/form-helpers'
import type { Lead, LeadSource, LeadStatus, Priority } from '@/types'

const priorityVariant = { High: 'destructive', Medium: 'secondary', Low: 'outline' } as const

export function LeadsView({ openNew, initialQuery }: { openNew?: boolean; initialQuery?: string }) {
  const { leads, users, customers, scoped, userName, create, update, remove, can, currentUser, refresh } = useCrm()
  const rows = scoped(leads)
  const openRows = rows.filter((l) => !['Converted', 'Lost', 'Unqualified'].includes(l.status))

  const convert = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'Conversion failed')
      }
      await refresh()
      toast.success(`${lead.name} converted`, { description: 'A customer and opportunity were created.' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert lead')
    }
  }

  return (
    <CrudPage<Lead>
      title="Leads"
      description="Capture, qualify and convert new business opportunities."
      singular="Lead"
      rows={rows}
      openNew={openNew}
      initialQuery={initialQuery}
      canDelete={can('Admin', 'Manager')}
      searchPlaceholder="Search leads…"
      searchFn={(l, q) => includesQ(q, l.name, l.company, l.email, l.code)}
      filters={[
        { id: 'status', label: 'Status', options: LEAD_STATUSES, getValue: (l) => l.status },
        { id: 'source', label: 'Source', options: LEAD_SOURCES, getValue: (l) => l.source },
        { id: 'priority', label: 'Priority', options: PRIORITIES, getValue: (l) => l.priority },
      ]}
      extraActions={(l) =>
        l.status === 'Qualified' ? [{ label: 'Convert to customer', icon: ArrowRightLeftIcon, onClick: () => convert(l) }] : []
      }
      summary={
        <section aria-label="Lead summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Open leads" value={openRows.length} icon={TargetIcon} tone="blue" />
          <KpiCard label="Qualified" value={rows.filter((l) => l.status === 'Qualified').length} icon={SparklesIcon} tone="green" />
          <KpiCard label="High priority" value={openRows.filter((l) => l.priority === 'High').length} icon={FlameIcon} tone="red" />
          <KpiCard label="Potential value" value={formatCompactCurrency(openRows.reduce((s, l) => s + l.expectedValue, 0))} icon={WalletIcon} tone="violet" />
        </section>
      }
      columns={[
        { id: 'name', header: 'Lead', sortValue: (l) => l.name, cell: (l) => <PersonCell name={l.name} subtitle={l.company} /> },
        { id: 'source', header: 'Source', className: 'hidden md:table-cell', sortValue: (l) => l.source, cell: (l) => <span className="text-muted-foreground">{l.source}</span> },
        { id: 'status', header: 'Status', sortValue: (l) => l.status, cell: (l) => <StatusBadge status={l.status} /> },
        { id: 'priority', header: 'Priority', className: 'hidden sm:table-cell', sortValue: (l) => PRIORITIES.indexOf(l.priority), cell: (l) => <Badge variant={priorityVariant[l.priority]}>{l.priority}</Badge> },
        { id: 'value', header: 'Expected value', className: 'hidden lg:table-cell text-right', sortValue: (l) => l.expectedValue, cell: (l) => <span className="font-medium tabular-nums">{formatCurrency(l.expectedValue)}</span> },
        { id: 'owner', header: 'Owner', className: 'hidden xl:table-cell', sortValue: (l) => userName(l.ownerId), cell: (l) => <PersonCell name={userName(l.ownerId)} size="sm" /> },
      ]}
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'company', label: 'Company', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'source', label: 'Source', type: 'select', required: true, options: toOptions(LEAD_SOURCES) },
        { name: 'status', label: 'Status', type: 'select', required: true, options: toOptions(LEAD_STATUSES) },
        { name: 'priority', label: 'Priority', type: 'select', required: true, options: toOptions(PRIORITIES) },
        {
          name: 'expectedValue',
          label: 'Expected value (USD)',
          type: 'number',
          required: true,
          validate: (v) => (Number(v) <= 0 ? 'Must be greater than 0' : undefined),
        },
        { name: 'ownerId', label: 'Owner', type: 'select', required: true, options: userOptions(users), full: true },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      toForm={(l) => ({
        name: l?.name ?? '',
        company: l?.company ?? '',
        email: l?.email ?? '',
        phone: l?.phone ?? '',
        source: l?.source ?? 'Website',
        status: l?.status ?? 'New',
        priority: l?.priority ?? 'Medium',
        expectedValue: l ? String(l.expectedValue) : '',
        ownerId: l?.ownerId ?? currentUser.id,
        notes: l?.notes ?? '',
      })}
      onSave={(v, existing) => {
        const patch = {
          ...v,
          source: v.source as LeadSource,
          status: v.status as LeadStatus,
          priority: v.priority as Priority,
          expectedValue: Number(v.expectedValue),
        }
        if (existing) update('leads', existing.id, patch)
        else create('leads', { ...patch, id: newId('l'), code: `LD-${leads.length + 2001}`, createdAt: new Date().toISOString() })
      }}
      onDelete={(l) => remove('leads', l.id)}
    />
  )
}
