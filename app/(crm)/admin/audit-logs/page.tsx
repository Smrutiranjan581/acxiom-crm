import type { Metadata } from 'next'
import { AdminAuditLogsView } from '@/components/modules/admin-audit-logs-view'

export const metadata: Metadata = { title: 'Audit Logs | AcxiomCRM' }

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsView />
}
