import type { Metadata } from 'next'
import { ActivitiesView } from '@/components/modules/activities-view'

export const metadata: Metadata = { title: 'Activities | AcxiomCRM' }

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  return <ActivitiesView openNew={params.new === 'true'} />
}
