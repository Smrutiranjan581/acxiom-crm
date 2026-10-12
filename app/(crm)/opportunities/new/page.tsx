import type { Metadata } from 'next'
import { OpportunitiesView } from '@/components/modules/opportunities-view'

export const metadata: Metadata = { title: 'New Opportunity | AcxiomCRM' }

export default function NewOpportunityPage() {
  return <OpportunitiesView openNew={true} />
}
