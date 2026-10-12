'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api, ApiError, endpoints } from '@/services/api'
import type {
  Activity,
  AuditAction,
  AuditLog,
  Customer,
  FollowUp,
  Lead,
  Opportunity,
  RelatedType,
  Role,
  User,
} from '@/types'

interface Collections {
  customers: Customer[]
  leads: Lead[]
  opportunities: Opportunity[]
  followUps: FollowUp[]
  activities: Activity[]
  users: User[]
}

type CollectionKey = keyof Collections
type ItemOf<K extends CollectionKey> = Collections[K][number]

const API_PATH_MAP: Record<CollectionKey, string> = {
  customers: endpoints.customers,
  leads: endpoints.leads,
  opportunities: endpoints.opportunities,
  followUps: endpoints.followUps,
  activities: endpoints.activities,
  users: endpoints.users,
}

const ENTITY_LABEL: Record<CollectionKey, string> = {
  customers: 'Customer',
  leads: 'Lead',
  opportunities: 'Opportunity',
  followUps: 'Follow-Up',
  activities: 'Activity',
  users: 'User',
}

interface CrmContextValue extends Collections {
  auditLogs: AuditLog[]
  currentUser: User
  loading: boolean
  isNeon: boolean
  refresh: () => Promise<void>
  signIn: (userId: string) => void
  setRole: (role: Role) => void
  create: <K extends CollectionKey>(key: K, item: ItemOf<K>) => Promise<ItemOf<K> | null>
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => Promise<ItemOf<K> | null>
  remove: <K extends CollectionKey>(key: K, id: string) => Promise<boolean>
  logEvent: (action: AuditAction, entity: string, recordId?: string, newValue?: string) => void
  scoped: <T extends { ownerId: string }>(items: T[]) => T[]
  userName: (id: string) => string
  relatedName: (type: RelatedType, id: string) => string
  can: (...roles: Role[]) => boolean
}

const CrmContext = createContext<CrmContextValue | null>(null)

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Collections>({
    customers: [],
    leads: [],
    opportunities: [],
    followUps: [],
    activities: [],
    users: [],
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [currentUserId, setCurrentUserId] = useState('u1')
  const [roleOverride, setRoleOverride] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNeon, setIsNeon] = useState(false)

  // Fetch all real data from backend API
  const refresh = useCallback(async () => {
    try {
      const [customers, leads, opportunities, followUps, activities, users, logs, setupInfo] = await Promise.all([
        api.get<Customer[]>(endpoints.customers).catch(() => []),
        api.get<Lead[]>(endpoints.leads).catch(() => []),
        api.get<Opportunity[]>(endpoints.opportunities).catch(() => []),
        api.get<FollowUp[]>(endpoints.followUps).catch(() => []),
        api.get<Activity[]>(endpoints.activities).catch(() => []),
        api.get<User[]>(endpoints.users).catch(() => []),
        api.get<AuditLog[]>(endpoints.auditLogs).catch(() => []),
        api.get<{ neonConfigured: boolean }>(endpoints.setup).catch(() => ({ neonConfigured: false })),
      ])

      setData({
        customers,
        leads,
        opportunities,
        followUps,
        activities,
        users,
      })
      setAuditLogs(logs)
      setIsNeon(setupInfo.neonConfigured)
    } catch (err) {
      console.error('Failed to load CRM data from API:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const defaultUser: User = {
    id: 'u1',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@acxiomcrm.com',
    phone: '+91 98200 11001',
    role: 'Admin',
    active: true,
    lockedOut: false,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  }

  const baseUser = data.users.find((u) => u.id === currentUserId) ?? data.users[0] ?? defaultUser
  const currentUser = useMemo(
    () => (roleOverride ? { ...baseUser, role: roleOverride } : baseUser),
    [baseUser, roleOverride],
  )

  const logEvent = useCallback(
    (action: AuditAction, entity: string, recordId = '—', newValue = '—') => {
      const item: AuditLog = {
        id: `log-${Date.now()}`,
        userId: currentUserId,
        action,
        entity,
        recordId,
        oldValue: '—',
        newValue,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString(),
      }
      setAuditLogs((prev) => [item, ...prev])
    },
    [currentUserId],
  )

  // Real Database CREATE
  const create = useCallback<CrmContextValue['create']>(
    async (key, item) => {
      try {
        const path = API_PATH_MAP[key]
        const created = await api.post<ItemOf<typeof key>>(path, item)
        setData((prev) => ({ ...prev, [key]: [created, ...prev[key]] }))
        logEvent('Create', ENTITY_LABEL[key], (created as any).id, `${ENTITY_LABEL[key]} created`)
        return created
      } catch (err: any) {
        console.error(`Failed to create ${key}:`, err)
        const msg = err instanceof ApiError ? err.message : err.message || 'Save failed'
        toast.error(msg)
        throw err
      }
    },
    [logEvent],
  )

  // Real Database UPDATE
  const update = useCallback<CrmContextValue['update']>(
    async (key, id, patch) => {
      try {
        const path = `${API_PATH_MAP[key]}/${id}`
        const updated = await api.put<ItemOf<typeof key>>(path, patch)
        setData((prev) => ({
          ...prev,
          [key]: (prev[key] as { id: string }[]).map((item) => (item.id === id ? { ...item, ...updated } : item)),
        }))
        logEvent('Update', ENTITY_LABEL[key], id, Object.keys(patch).join(', ') + ' updated')
        return updated
      } catch (err: any) {
        console.error(`Failed to update ${key}:`, err)
        const msg = err instanceof ApiError ? err.message : err.message || 'Update failed'
        toast.error(msg)
        throw err
      }
    },
    [logEvent],
  )

  // Real Database DELETE
  const remove = useCallback<CrmContextValue['remove']>(
    async (key, id) => {
      try {
        const path = `${API_PATH_MAP[key]}/${id}`
        await api.delete(path)
        setData((prev) => ({
          ...prev,
          [key]: (prev[key] as { id: string }[]).filter((item) => item.id !== id),
        }))
        logEvent('Delete', ENTITY_LABEL[key], id)
        return true
      } catch (err: any) {
        console.error(`Failed to delete ${key}:`, err)
        const msg = err instanceof ApiError ? err.message : err.message || 'Delete failed'
        toast.error(msg)
        return false
      }
    },
    [logEvent],
  )

  const value = useMemo<CrmContextValue>(() => {
    const userMap = new Map(data.users.map((u) => [u.id, u.name]))
    return {
      ...data,
      auditLogs,
      currentUser,
      loading,
      isNeon,
      refresh,
      signIn: (userId) => {
        setCurrentUserId(userId)
        setRoleOverride(null)
      },
      setRole: setRoleOverride,
      create,
      update,
      remove,
      logEvent,
      scoped: (items) =>
        currentUser.role === 'SalesExecutive' ? items.filter((i) => i.ownerId === currentUser.id) : items,
      userName: (id) => userMap.get(id) ?? 'Unassigned',
      relatedName: (type, id) => {
        if (type === 'Customer') return data.customers.find((c) => c.id === id)?.company ?? 'Unknown customer'
        if (type === 'Lead') return data.leads.find((l) => l.id === id)?.name ?? 'Unknown lead'
        return data.opportunities.find((o) => o.id === id)?.name ?? 'Unknown opportunity'
      },
      can: (...roles) => roles.includes(currentUser.role),
    }
  }, [data, auditLogs, currentUser, loading, isNeon, refresh, create, update, remove, logEvent])

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm must be used within CrmProvider')
  return ctx
}
