import type { Metadata } from 'next'
import { LeadsView } from '@/components/modules/leads-view'

export const metadata: Metadata = { title: 'Leads | AcxiomCRM' }

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string }>
}) {
  const params = await searchParams
  return <LeadsView initialQuery={params.q} openNew={params.new === 'true'} />
}
