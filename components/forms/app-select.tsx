'use client'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export function toOptions(values: readonly string[]): SelectOption[] {
  return values.map((v) => ({ label: v === 'SalesExecutive' ? 'Sales Executive' : v, value: v }))
}

export function AppSelect({
  id,
  items,
  value,
  onValueChange,
  placeholder = 'Select…',
  invalid,
  className,
  size = 'default',
  ariaLabel,
  disabled,
}: {
  id?: string
  items: SelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  className?: string
  size?: 'sm' | 'default'
  ariaLabel?: string
  disabled?: boolean
}) {
  const withPlaceholder = [{ label: placeholder, value: null as string | null }, ...items]
  return (
    <Select
      items={withPlaceholder}
      value={value || null}
      onValueChange={(v) => onValueChange((v as string | null) ?? '')}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        className={cn('w-full bg-card', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
