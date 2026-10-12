'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AppSelect, type SelectOption } from '@/components/forms/app-select'

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-5 md:grid-cols-2">{children}</FieldGroup>
      </CardContent>
    </Card>
  )
}

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  )
}

interface BaseProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export function TextField({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...inputProps
}: BaseProps & Omit<React.ComponentProps<typeof Input>, 'id'>) {
  return (
    <Field data-invalid={!!error || undefined} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredMark />}
      </FieldLabel>
      <Input id={id} aria-invalid={!!error || undefined} className="bg-card" {...inputProps} />
      {error ? <FieldError>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

export function TextareaField({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...props
}: BaseProps & Omit<React.ComponentProps<typeof Textarea>, 'id'>) {
  return (
    <Field data-invalid={!!error || undefined} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredMark />}
      </FieldLabel>
      <Textarea id={id} aria-invalid={!!error || undefined} className="min-h-24 bg-card" {...props} />
      {error ? <FieldError>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  className,
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
}: BaseProps & {
  items: SelectOption[]
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Field data-invalid={!!error || undefined} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {required && <RequiredMark />}
      </FieldLabel>
      <AppSelect
        id={id}
        items={items}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        invalid={!!error}
        disabled={disabled}
      />
      {error ? <FieldError>{error}</FieldError> : hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}
