import type { Metadata } from 'next'
import { CustomersView } from '@/components/modules/customers-view'

export const metadata: Metadata = { title: 'New Customer | AcxiomCRM' }

export default function NewCustomerPage() {
  return <CustomersView openNew={true} />
}
