'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCrm } from '@/components/providers/crm-provider'
import type { Role } from '@/types'

export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const router = useRouter()
  const { can } = useCrm()
  const allowed = can(...roles)

  useEffect(() => {
    if (!allowed) router.replace('/unauthorized')
  }, [allowed, router])

  if (!allowed) return null
  return <>{children}</>
}
