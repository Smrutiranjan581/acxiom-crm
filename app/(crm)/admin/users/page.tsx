import type { Metadata } from 'next'
import { AdminUsersView } from '@/components/modules/admin-users-view'

export const metadata: Metadata = { title: 'User Administration | AcxiomCRM' }

export default function AdminUsersPage() {
  return <AdminUsersView />
}
