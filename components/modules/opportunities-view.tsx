'use client'

import { HandshakeIcon, PercentIcon, TrophyIcon, WalletIcon } from 'lucide-react'
import { CrudPage } from '@/components/crm/crud-page'
import { KpiCard } from '@/components/crm/kpi-card'
import { PersonCell } from '@/components/crm/person-cell'
import { StatusBadge } from '@/components/crm/status-badge'
import { Progress } from '@/components/ui/progress'
import { toOptions } from '@/components/forms/app-select'
import { useCrm } from '@/components/providers/crm-provider'
import { OPEN_STAGES, STAGES, STAGE_PROBABILITY } from '@/lib/constants'
import { formatCompactCurrency, formatCurrency, formatDate, todayISO, weightedValue } from '@/lib/format'
import { includesQ, newId, userOptions } from '@/lib/form-helpers'
import type { Opportunity, OpportunityStage } from '@/types'

export function OpportunitiesView({ openNew, initialQuery }: { openNew?: boolean; initialQuery?: string }) {
  const { opportunities, customers, users, scoped, userName, relatedName, create, update, remove, can, currentUser } = useCrm()
  const rows = scoped(opportunities)
  const open = rows.filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
  const won = rows.filter((o) => o.stage === 'Won')

  return (
    <CrudPage<Opportunity>
      title="Opportunities"
      description="Track deals through every stage of your sales pipeline."
      singular="Opportunity"
      rows={rows}
      openNew={openNew}
      initialQuery={initialQuery}
      canDelete={can('Admin', 'Manager')}
      searchPlaceholder="Search opportunities…"
      searchFn={(o, q) => includesQ(q, o.name, relatedName('Customer', o.customerId))}
      filters={[{ id: 'stage', label: 'Stage', options: STAGES, getValue: (o) => o.stage }]}
      summary={
        <section aria-label="Pipeline summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Open deals" value={open.length} icon={HandshakeIcon} tone="blue" />
          <KpiCard label="Pipeline value" value={formatCompactCurrency(open.reduce((s, o) => s + o.amount, 0))} icon={WalletIcon} tone="violet" />
          <KpiCard label="Weighted forecast" value={formatCompactCurrency(open.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0))} icon={PercentIcon} tone="amber" />
          <KpiCard label="Closed won" value={formatCompactCurrency(won.reduce((s, o) => s + o.amount, 0))} icon={TrophyIcon} tone="green" hint={`${won.length} deals`} />
        </section>
      }
      columns={[
        {
          id: 'name',
          header: 'Opportunity',
          sortValue: (o) => o.name,
          cell: (o) => (
            <div className="flex flex-col">
              <span className="font-medium">{o.name}</span>
              <span className="text-xs text-muted-foreground">{relatedName('Customer', o.customerId)}</span>
            </div>
          ),
        },
        { id: 'stage', header: 'Stage', sortValue: (o) => STAGES.indexOf(o.stage), cell: (o) => <StatusBadge status={o.stage} /> },
        { id: 'amount', header: 'Amount', className: 'text-right', sortValue: (o) => o.amount, cell: (o) => <span className="font-medium tabular-nums">{formatCurrency(o.amount)}</span> },
        {
          id: 'probability',
          header: 'Probability',
          className: 'hidden lg:table-cell',
          sortValue: (o) => o.probability,
          cell: (o) => (
            <div className="flex w-32 items-center gap-2">
              <Progress value={o.probability} aria-label="Win probability" />
              <span className="w-9 text-xs tabular-nums text-muted-foreground">{o.probability}%</span>
            </div>
          ),
        },
        {
          id: 'close',
          header: 'Expected close',
          className: 'hidden md:table-cell',
          sortValue: (o) => o.expectedCloseDate,
          cell: (o) => {
            const late = (OPEN_STAGES as readonly string[]).includes(o.stage) && o.expectedCloseDate < todayISO()
            return <span className={late ? 'font-medium text-destructive' : 'text-muted-foreground'}>{formatDate(o.expectedCloseDate)}</span>
          },
        },
        { id: 'owner', header: 'Owner', className: 'hidden xl:table-cell', sortValue: (o) => userName(o.ownerId), cell: (o) => <PersonCell name={userName(o.ownerId)} size="sm" /> },
      ]}
      fields={[
        { name: 'name', label: 'Opportunity name', required: true, full: true },
        { name: 'customerId', label: 'Customer', type: 'select', required: true, full: true, options: scoped(customers).map((c) => ({ label: `${c.company} — ${c.name}`, value: c.id })) },
        { name: 'stage', label: 'Stage', type: 'select', required: true, options: toOptions(STAGES), hint: 'Probability defaults from stage when left empty' },
        { name: 'amount', label: 'Amount (USD)', type: 'number', required: true, validate: (v) => (Number(v) <= 0 ? 'Must be greater than 0' : undefined) },
        { name: 'probability', label: 'Probability (%)', type: 'number', validate: (v) => (v && (Number(v) < 0 || Number(v) > 100) ? 'Must be between 0 and 100' : undefined) },
        {
          name: 'expectedCloseDate',
          label: 'Expected close date',
          type: 'date',
          required: true,
          validate: (v, values) =>
            !['Won', 'Lost'].includes(values.stage) && v && v < todayISO()
              ? 'Expected Close Date cannot be in the past'
              : undefined,
        },
        { name: 'ownerId', label: 'Owner', type: 'select', required: true, options: userOptions(users), full: true },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      toForm={(o) => ({
        name: o?.name ?? '',
        customerId: o?.customerId ?? '',
        stage: o?.stage ?? 'Qualification',
        amount: o ? String(o.amount) : '',
        probability: o ? String(o.probability) : '',
        expectedCloseDate: o?.expectedCloseDate ?? '',
        ownerId: o?.ownerId ?? currentUser.id,
        notes: o?.notes ?? '',
      })}
      onSave={(v, existing) => {
        const stage = v.stage as OpportunityStage
        const patch = {
          ...v,
          stage,
          amount: Number(v.amount),
          probability: v.probability === '' ? STAGE_PROBABILITY[stage] : Number(v.probability),
        }
        if (existing) update('opportunities', existing.id, patch)
        else create('opportunities', { ...patch, id: newId('o'), createdAt: new Date().toISOString() })
      }}
      onDelete={(o) => remove('opportunities', o.id)}
    />
  )
}
