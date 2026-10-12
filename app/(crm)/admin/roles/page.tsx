import type { Metadata } from 'next'
import { AdminRolesView } from '@/components/modules/admin-roles-view'

export const metadata: Metadata = { title: 'Roles & Permissions | AcxiomCRM' }

export default function AdminRolesPage() {
  return <AdminRolesView />
}
