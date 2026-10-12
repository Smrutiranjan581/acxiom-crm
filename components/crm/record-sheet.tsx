'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { SelectField, TextareaField, TextField } from '@/components/forms/form-fields'
import type { SelectOption } from '@/components/forms/app-select'
import { cn } from '@/lib/utils'

export type FormValues = Record<string, string>

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea'
  options?: SelectOption[]
  required?: boolean
  full?: boolean
  placeholder?: string
  hint?: string
  validate?: (value: string, values: FormValues) => string | undefined
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^[+\d][\d\s()-]{6,}$/

function check(field: FieldDef, values: FormValues) {
  const v = (values[field.name] ?? '').trim()
  if (field.required && !v) return `${field.label} is required`
  if (v && field.type === 'email' && !EMAIL.test(v)) return 'Enter a valid email address'
  if (v && field.type === 'tel' && !PHONE.test(v)) return 'Enter a valid phone number'
  if (v && field.type === 'number' && Number.isNaN(Number(v))) return `${field.label} must be a number`
  return field.validate?.(v, values)
}

export function RecordSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = 'Save',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: FieldDef[]
  initial: FormValues
  submitLabel?: string
  onSubmit: (values: FormValues) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border bg-card">
        <DialogHeader className="border-b px-6 py-4 shrink-0 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        {open && (
          <RecordForm
            key={JSON.stringify(initial)}
            fields={fields}
            initial={initial}
            submitLabel={submitLabel}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecordForm({
  fields,
  initial,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  fields: FieldDef[]
  initial: FormValues
  submitLabel: string
  onCancel: () => void
  onSubmit: (values: FormValues) => void
}) {
  const [values, setValues] = useState<FormValues>(initial)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)

  const set = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = Object.fromEntries(fields.map((f) => [f.name, check(f, values)]))
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))
    onSubmit(values)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1 max-h-[calc(90vh-140px)]">
        <FieldGroup className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          {fields.map((f) => {
            const id = `field-${f.name}`
            const common = { id, label: f.label, required: f.required, error: errors[f.name], hint: f.hint }
            const span = cn((f.full || f.type === 'textarea') && 'sm:col-span-2')
            if (f.type === 'select')
              return (
                <SelectField
                  key={f.name}
                  {...common}
                  className={span}
                  items={f.options ?? []}
                  value={values[f.name] ?? ''}
                  onValueChange={(v) => set(f.name, v)}
                  placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}`}
                />
              )
            if (f.type === 'textarea')
              return (
                <TextareaField
                  key={f.name}
                  {...common}
                  className={span}
                  value={values[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )
            return (
              <TextField
                key={f.name}
                {...common}
                className={span}
                type={f.type ?? 'text'}
                value={values[f.name] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )
          })}
        </FieldGroup>
      </ScrollArea>
      <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4 bg-muted/40 shrink-0 m-0 rounded-none">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Spinner data-icon="inline-start" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
