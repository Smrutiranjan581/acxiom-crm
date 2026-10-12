'use client'

import { useState } from 'react'
import { DownloadIcon, FilterIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDateTime } from '@/lib/format'

export function AdminAuditLogsView() {
  const { auditLogs, userName, refresh } = useCrm()
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (filterEntity !== 'all' && log.entity !== filterEntity) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const u = userName(log.userId).toLowerCase()
      const details = (log.newValue || log.recordId || '').toLowerCase()
      return u.includes(q) || details.includes(q) || log.entity.toLowerCase().includes(q)
    }
    return true
  })

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
    toast.success('Audit logs refreshed from database')
  }

  function exportCsv() {
    const header = ['Timestamp', 'User', 'Action', 'Entity', 'Record ID', 'Old Value', 'New Value', 'IP Address']
    const rows = filtered.map((log) => [
      log.timestamp,
      `"${userName(log.userId)}"`,
      log.action,
      log.entity,
      log.recordId,
      `"${(log.oldValue || '').replace(/"/g, '""')}"`,
      `"${(log.newValue || '').replace(/"/g, '""')}"`,
      log.ipAddress,
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `acxiomcrm-audit-logs-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filtered.length} audit records`)
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Immutable audit trail capturing all authentication, security changes, and CRM lifecycle transactions."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Audit Logs' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCwIcon className={`size-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <DownloadIcon className="size-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search user, entity, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="all">All Actions</option>
                <option value="Login">Login</option>
                <option value="Failed Login">Failed Login</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="Role Change">Role Change</option>
                <option value="Logout">Logout</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="all">All Entities</option>
                <option value="Customer">Customer</option>
                <option value="Lead">Lead</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Activity">Activity</option>
                <option value="User">User</option>
                <option value="Session">Session</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity & Security Events</CardTitle>
              <CardDescription>Showing {filtered.length} logged events in reverse chronological order.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Record ID</th>
                  <th className="px-4 py-3">Details / Value</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3 font-medium">{userName(log.userId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.action} /></td>
                    <td className="px-4 py-3 font-medium">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.recordId}</td>
                    <td className="px-4 py-3 max-w-sm truncate text-xs text-muted-foreground">{log.newValue || log.oldValue || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No audit log entries matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
