'use client'

import { useState } from 'react'
import {
  BarChart3Icon,
  CalendarIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  HandshakeIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/crm/kpi-card'
import { PageHeader } from '@/components/layout/page-header'
import { PersonCell } from '@/components/crm/person-cell'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { OPEN_STAGES } from '@/lib/constants'
import { formatCompactCurrency, formatCurrency, formatDate, formatDateTime, weightedValue } from '@/lib/format'

type ReportTab =
  | 'pipeline'
  | 'customers'
  | 'leads'
  | 'opportunities'
  | 'followUps'
  | 'conversion'
  | 'activities'
  | 'audit'

export function ReportsView() {
  const { customers, leads, opportunities, followUps, activities, auditLogs, scoped, userName } = useCrm()
  const [activeTab, setActiveTab] = useState<ReportTab>('pipeline')

  const myCustomers = scoped(customers)
  const myLeads = scoped(leads)
  const myOpps = scoped(opportunities)
  const myFollowUps = scoped(followUps)
  const myActivities = scoped(activities)

  // Calculations
  const openOpps = myOpps.filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
  const wonOpps = myOpps.filter((o) => o.stage === 'Won')
  const totalPipeline = openOpps.reduce((s, o) => s + o.amount, 0)
  const weightedPipeline = openOpps.reduce((s, o) => s + weightedValue(o.amount, o.probability), 0)

  const convertedLeads = myLeads.filter((l) => l.status === 'Converted').length
  const conversionRate = myLeads.length > 0 ? Math.round((convertedLeads / myLeads.length) * 100) : 0

  const exportCurrentReport = () => {
    let filename = `acxiomcrm-${activeTab}-report.csv`
    let csvContent = ''

    if (activeTab === 'pipeline' || activeTab === 'opportunities') {
      csvContent = [
        ['Opportunity', 'Customer ID', 'Stage', 'Amount', 'Probability', 'Weighted Value', 'Expected Close', 'Owner'],
        ...myOpps.map((o) => [
          `"${o.name}"`,
          `"${o.customerId}"`,
          o.stage,
          o.amount,
          `${o.probability}%`,
          weightedValue(o.amount, o.probability),
          o.expectedCloseDate,
          `"${userName(o.ownerId)}"`,
        ]),
      ].map((e) => e.join(',')).join('\n')
    } else if (activeTab === 'customers') {
      csvContent = [
        ['Customer Code', 'Name', 'Company', 'Email', 'Phone', 'City', 'Status', 'Owner', 'Created Date'],
        ...myCustomers.map((c) => [
          c.code,
          `"${c.name}"`,
          `"${c.company}"`,
          c.email,
          c.phone,
          c.city,
          c.status,
          `"${userName(c.ownerId)}"`,
          c.createdAt,
        ]),
      ].map((e) => e.join(',')).join('\n')
    } else if (activeTab === 'leads' || activeTab === 'conversion') {
      csvContent = [
        ['Lead Code', 'Name', 'Company', 'Source', 'Status', 'Priority', 'Expected Value', 'Owner', 'Created Date'],
        ...myLeads.map((l) => [
          l.code,
          `"${l.name}"`,
          `"${l.company}"`,
          l.source,
          l.status,
          l.priority,
          l.expectedValue,
          `"${userName(l.ownerId)}"`,
          l.createdAt,
        ]),
      ].map((e) => e.join(',')).join('\n')
    } else if (activeTab === 'followUps') {
      csvContent = [
        ['Subject', 'Type', 'Status', 'Date', 'Related Type', 'Related ID', 'Owner', 'Notes'],
        ...myFollowUps.map((f) => [
          `"${f.subject}"`,
          f.type,
          f.status,
          f.date,
          f.relatedType,
          f.relatedId,
          `"${userName(f.ownerId)}"`,
          `"${f.notes.replace(/"/g, '""')}"`,
        ]),
      ].map((e) => e.join(',')).join('\n')
    } else if (activeTab === 'activities') {
      csvContent = [
        ['Subject', 'Type', 'Status', 'Date', 'Related Type', 'Related ID', 'Owner', 'Description'],
        ...myActivities.map((a) => [
          `"${a.subject}"`,
          a.type,
          a.status,
          a.date,
          a.relatedType,
          a.relatedId,
          `"${userName(a.ownerId)}"`,
          `"${(a.description || '').replace(/"/g, '""')}"`,
        ]),
      ].map((e) => e.join(',')).join('\n')
    } else if (activeTab === 'audit') {
      csvContent = [
        ['Timestamp', 'User ID', 'Action', 'Entity', 'Record ID', 'New Value', 'IP Address'],
        ...auditLogs.map((log) => [
          log.timestamp,
          log.userId,
          log.action,
          log.entity,
          log.recordId,
          `"${(log.newValue || '').replace(/"/g, '""')}"`,
          log.ipAddress,
        ]),
      ].map((e) => e.join(',')).join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${activeTab} report to CSV`)
  }

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'pipeline', label: 'Pipeline Report', icon: HandshakeIcon },
    { id: 'conversion', label: 'Conversion Report', icon: TargetIcon },
    { id: 'customers', label: 'Customers Report', icon: UsersIcon },
    { id: 'leads', label: 'Leads Report', icon: TargetIcon },
    { id: 'opportunities', label: 'Opportunities Report', icon: HandshakeIcon },
    { id: 'followUps', label: 'Follow-Up Report', icon: CalendarIcon },
    { id: 'activities', label: 'User Activities', icon: BarChart3Icon },
    { id: 'audit', label: 'Security & Audit', icon: ShieldCheckIcon },
  ]

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive management and sales performance reports with CSV export."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button variant="outline" onClick={exportCurrentReport}>
            <DownloadIcon data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />

      {/* KPI Overview */}
      <section aria-label="KPI overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Pipeline" value={formatCompactCurrency(totalPipeline)} icon={HandshakeIcon} tone="blue" />
        <KpiCard label="Weighted Forecast" value={formatCompactCurrency(weightedPipeline)} icon={HandshakeIcon} tone="green" />
        <KpiCard label="Lead Conversion Rate" value={`${conversionRate}%`} icon={TargetIcon} tone="violet" hint={`${convertedLeads} converted`} />
        <KpiCard label="Total Customers" value={myCustomers.length} icon={UsersIcon} tone="amber" />
      </section>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <Icon className="size-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="capitalize">{activeTab} Report</CardTitle>
            <CardDescription>Filtered records and metrics according to your role scope.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportCurrentReport}>
            <FileSpreadsheetIcon className="size-4 mr-2" />
            Download Excel / CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === 'pipeline' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                  <tr>
                    <th className="px-4 py-3">Opportunity</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Win Prob</th>
                    <th className="px-4 py-3 text-right">Weighted Pipeline</th>
                    <th className="px-4 py-3">Expected Close</th>
                    <th className="px-4 py-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myOpps.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{o.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.stage} /></td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(o.amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{o.probability}%</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary">{formatCurrency(weightedValue(o.amount, o.probability))}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(o.expectedCloseDate)}</td>
                      <td className="px-4 py-3"><PersonCell name={userName(o.ownerId)} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'conversion' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                  <tr>
                    <th className="px-4 py-3">Lead Code</th>
                    <th className="px-4 py-3">Lead Name</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Expected Value</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                      <td className="px-4 py-3 font-medium">{l.name}</td>
                      <td className="px-4 py-3">{l.company}</td>
                      <td className="px-4 py-3">{l.source}</td>
                      <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(l.expectedValue)}</td>
                      <td className="px-4 py-3"><PersonCell name={userName(l.ownerId)} size="sm" /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'customers' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Email & Phone</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.company}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span>{c.email}</span>
                          <span className="text-muted-foreground">{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{c.city}, {c.state}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><PersonCell name={userName(c.ownerId)} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'audit' && (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Record Details</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                      <td className="px-4 py-3 font-medium">{userName(log.userId)}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.action} /></td>
                      <td className="px-4 py-3 font-medium">{log.entity}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-xs text-muted-foreground">{log.newValue || log.recordId}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {(activeTab === 'leads' || activeTab === 'opportunities' || activeTab === 'followUps' || activeTab === 'activities') && (
              <div className="p-8 text-center text-muted-foreground">
                Showing {activeTab === 'leads' ? myLeads.length : activeTab === 'opportunities' ? myOpps.length : activeTab === 'followUps' ? myFollowUps.length : myActivities.length} records. Click &quot;Export CSV&quot; above to download the full dataset.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
