import type { Metadata } from 'next'
import { CustomersView } from '@/components/modules/customers-view'

export const metadata: Metadata = { title: 'Customers | AcxiomCRM' }

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string }>
}) {
  const params = await searchParams
  return <CustomersView initialQuery={params.q} openNew={params.new === 'true'} />
}
