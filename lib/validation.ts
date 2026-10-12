import { todayISO } from '@/lib/format'

export type Errors<T> = Partial<Record<keyof T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/

export const rules = {
  required: (value: unknown, label: string) =>
    value === undefined || value === null || String(value).trim() === '' ? `${label} is required` : undefined,
  email: (value: string) => (value && !EMAIL_RE.test(value) ? 'Enter a valid email address' : undefined),
  phone: (value: string) =>
    value && !PHONE_RE.test(value) ? 'Enter a valid phone number (10–15 digits)' : undefined,
  length: (value: string, label: string, min: number, max: number) =>
    value && (value.trim().length < min || value.trim().length > max)
      ? `${label} must be ${min}–${max} characters`
      : undefined,
  positive: (value: number | string, label: string) =>
    value === '' || Number.isNaN(Number(value)) || Number(value) <= 0 ? `${label} must be greater than 0` : undefined,
  range: (value: number | string, label: string, min: number, max: number) =>
    value === '' || Number.isNaN(Number(value)) || Number(value) < min || Number(value) > max
      ? `${label} must be between ${min} and ${max}`
      : undefined,
  notPast: (value: string, label: string) =>
    value && value.slice(0, 10) < todayISO() ? `${label} cannot be in the past` : undefined,
  password: (value: string) =>
    value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value)
      ? 'Min 8 characters with upper, lower, number and symbol'
      : undefined,
}

export function firstError(...checks: (string | undefined)[]) {
  return checks.find(Boolean)
}

export function hasErrors<T>(errors: Errors<T>) {
  return Object.values(errors).some(Boolean)
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
