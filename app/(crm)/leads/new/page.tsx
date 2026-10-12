import type { Metadata } from 'next'
import { LeadsView } from '@/components/modules/leads-view'

export const metadata: Metadata = { title: 'New Lead | AcxiomCRM' }

export default function NewLeadPage() {
  return <LeadsView openNew={true} />
}
