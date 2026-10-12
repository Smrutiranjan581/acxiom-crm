import type { Metadata } from 'next'
import { FollowUpsView } from '@/components/modules/follow-ups-view'

export const metadata: Metadata = { title: 'Follow-Ups | AcxiomCRM' }

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  return <FollowUpsView openNew={params.new === 'true'} />
}
