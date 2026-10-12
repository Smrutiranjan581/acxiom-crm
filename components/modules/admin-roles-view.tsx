'use client'

import { CheckIcon, MinusIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'

export function AdminRolesView() {
  const { users } = useCrm()

  const adminCount = users.filter((u) => u.role === 'Admin').length
  const managerCount = users.filter((u) => u.role === 'Manager').length
  const salesCount = users.filter((u) => u.role === 'SalesExecutive').length

  const matrix = [
    { module: 'Dashboard', admin: 'Full Visibility & Metrics', manager: 'Team Pipeline & Outcomes', sales: 'Own / Assigned Deals & Activities' },
    { module: 'Customer Management', admin: 'Create, Edit, Delete All Accounts', manager: 'Create, Edit, Team Accounts', sales: 'Create, Edit Assigned Accounts' },
    { module: 'Lead Management', admin: 'Full Capture, Convert & Delete', manager: 'Team Leads & Conversions', sales: 'Capture, Qualify, Convert Assigned Leads' },
    { module: 'Opportunity Pipeline', admin: 'Full Pipeline & Stage Overrides', manager: 'Team Pipeline & Weighted Forecasts', sales: 'Own Opportunities & Stage Updates' },
    { module: 'Follow-Up Management', admin: 'All Organization Activities', manager: 'Team Follow-Ups & Missed Tracking', sales: 'Personal Scheduled & Overdue Follow-ups' },
    { module: 'User & Security Admin', admin: 'User Creation, Roles, Lockout & Password Reset', manager: 'View Team Members', sales: 'No Access' },
    { module: 'Audit Log Viewer', admin: 'Full Security, Login & CRUD Audit Trail', manager: 'Limited Activity Log', sales: 'No Access' },
    { module: 'REST API Scope', admin: 'All API Endpoints Authorized', manager: 'Manager-scoped Endpoints', sales: 'Self-scoped Endpoints' },
    { module: 'Reporting & Analytics', admin: 'All 8 Reports & Full Organization CSV Export', manager: 'Team Pipeline, Conversion & Follow-up Reports', sales: 'Own Sales & Pipeline Report' },
  ]

  return (
    <>
      <PageHeader
        title="Role & Permission Matrix"
        description="Role-based access control (RBAC) definitions and module authorization boundaries."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Roles' }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <StatusBadge status="Admin" />
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{adminCount} users</span>
            </div>
            <CardTitle className="mt-2 text-base">System Administrator</CardTitle>
            <CardDescription className="text-xs">
              Complete application administration, user management, audit logs, configuration, and all CRM records.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <StatusBadge status="Manager" />
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{managerCount} users</span>
            </div>
            <CardTitle className="mt-2 text-base">Sales Manager</CardTitle>
            <CardDescription className="text-xs">
              Team, customer, lead, and opportunity oversight with executive pipeline reporting. No security administration.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <StatusBadge status="SalesExecutive" />
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{salesCount} users</span>
            </div>
            <CardTitle className="mt-2 text-base">Sales Executive</CardTitle>
            <CardDescription className="text-xs">
              Personal book of business: assigned customers, leads, opportunities, and scheduled follow-ups.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission & Authorization Matrix</CardTitle>
          <CardDescription>Server-enforced access controls across all CRM modules and REST endpoints.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                <tr>
                  <th className="px-4 py-3">Module / Area</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Sales Executive</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {matrix.map((row) => (
                  <tr key={row.module} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{row.module}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.admin}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.manager}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
