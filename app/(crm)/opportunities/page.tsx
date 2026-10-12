import type { Metadata } from 'next'
import { OpportunitiesView } from '@/components/modules/opportunities-view'

export const metadata: Metadata = { title: 'Opportunities | AcxiomCRM' }

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string }>
}) {
  const params = await searchParams
  return <OpportunitiesView initialQuery={params.q} openNew={params.new === 'true'} />
}
