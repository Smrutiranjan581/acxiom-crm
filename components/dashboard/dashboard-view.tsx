'use client'

import Link from 'next/link'
import { CalendarClockIcon, HandshakeIcon, PlusIcon, TargetIcon, TrophyIcon, UsersIcon, WalletIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/crm/kpi-card'
import { PageHeader } from '@/components/layout/page-header'
import { useCrm } from '@/components/providers/crm-provider'
import { LeadSourceChart } from '@/components/dashboard/lead-source-chart'
import { PipelineCard } from '@/components/dashboard/pipeline-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TopDeals } from '@/components/dashboard/top-deals'
import { UpcomingFollowUps } from '@/components/dashboard/upcoming-follow-ups'
import { OPEN_STAGES } from '@/lib/constants'
import { formatCompactCurrency, todayISO, weightedValue } from '@/lib/format'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function DashboardView() {
  const { currentUser, customers, leads, opportunities, followUps, scoped } = useCrm()
  const myCustomers = scoped(customers)
  const myLeads = scoped(leads)
  const myOpps = scoped(opportunities)
  const myFollowUps = scoped(followUps)

  const open = myOpps.filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
  const won = myOpps.filter((o) => o.stage === 'Won')
  const lost = myOpps.filter((o) => o.stage === 'Lost')
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0
  const pipeline = open.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0)
  const today = todayISO()
  const overdue = myFollowUps.filter((f) => f.status === 'Planned' && f.date.slice(0, 10) < today).length
  const dueToday = myFollowUps.filter((f) => f.status === 'Planned' && f.date.slice(0, 10) === today).length

  const scope =
    currentUser.role === 'SalesExecutive' ? 'Here is your personal pipeline for today.' : 'Here is how your team is performing today.'

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${currentUser.name.split(' ')[0]}`}
        description={scope}
        actions={
          <>
            <Button variant="outline" render={<Link href="/leads/new" />} nativeButton={false}>
              <TargetIcon data-icon="inline-start" />
              New lead
            </Button>
            <Button render={<Link href="/opportunities/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              New opportunity
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total customers" value={myCustomers.length} icon={UsersIcon} tone="blue" change={8.2} hint="vs last month" />
        <KpiCard label="Active leads" value={myLeads.filter((l) => !['Converted', 'Lost', 'Unqualified'].includes(l.status)).length} icon={TargetIcon} tone="violet" change={12.5} hint="vs last month" />
        <KpiCard label="Open opportunities" value={open.length} icon={HandshakeIcon} tone="amber" change={-3.1} hint="vs last month" />
        <KpiCard label="Weighted pipeline" value={formatCompactCurrency(pipeline)} icon={WalletIcon} tone="green" change={15.4} hint="amount × probability" />
        <KpiCard label="Win rate" value={`${winRate}%`} icon={TrophyIcon} tone="green" change={4.0} hint={`${won.length} won · ${lost.length} lost`} />
        <KpiCard label="Follow-ups due" value={dueToday} icon={CalendarClockIcon} tone={overdue ? 'red' : 'blue'} hint={overdue ? `${overdue} overdue need attention` : 'Nothing overdue'} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <LeadSourceChart />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopDeals />
        </div>
        <PipelineCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <UpcomingFollowUps />
        <RecentActivity />
      </section>
    </>
  )
}
