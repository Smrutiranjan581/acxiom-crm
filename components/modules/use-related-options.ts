'use client'

import { useCrm } from '@/components/providers/crm-provider'

export function useRelatedOptions() {
  const { customers, leads, opportunities, scoped } = useCrm()
  return [
    ...scoped(customers).map((c) => ({ label: `Customer · ${c.company}`, value: `Customer:${c.id}` })),
    ...scoped(leads).map((l) => ({ label: `Lead · ${l.name}`, value: `Lead:${l.id}` })),
    ...scoped(opportunities).map((o) => ({ label: `Opportunity · ${o.name}`, value: `Opportunity:${o.id}` })),
  ]
}

export function splitRelated(value: string) {
  const [relatedType, relatedId] = value.split(':') as ['Customer' | 'Lead' | 'Opportunity', string]
  return { relatedType, relatedId }
}
