import type { SelectOption } from '@/components/forms/app-select'
import type { User } from '@/types'

export const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

export const userOptions = (users: User[]): SelectOption[] =>
  users.filter((u) => u.active).map((u) => ({ label: u.name, value: u.id }))

export const toLocalInput = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const includesQ = (q: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()))
