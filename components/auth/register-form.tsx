'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/forms/form-fields'
import { useCrm } from '@/components/providers/crm-provider'
import { firstError, hasErrors, rules, type Errors } from '@/lib/validation'
import { api, endpoints } from '@/services/api'
import type { User } from '@/types'

const empty = { name: '', email: '', phone: '', password: '', confirm: '' }
type Values = typeof empty

export function RegisterForm() {
  const router = useRouter()
  const { refresh } = useCrm()
  const [values, setValues] = useState<Values>(empty)
  const [errors, setErrors] = useState<Errors<Values>>({})
  const [loading, setLoading] = useState(false)

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  function validate(v: Values): Errors<Values> {
    return {
      name: firstError(rules.required(v.name, 'Full name'), rules.length(v.name, 'Full name', 3, 100)),
      email: firstError(rules.required(v.email, 'Email'), rules.email(v.email)),
      phone: firstError(rules.required(v.phone, 'Phone'), rules.phone(v.phone)),
      password: firstError(rules.required(v.password, 'Password'), rules.password(v.password)),
      confirm: firstError(
        rules.required(v.confirm, 'Confirm password'),
        v.confirm && v.confirm !== v.password ? 'Passwords do not match' : undefined,
      ),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (hasErrors(next)) return

    setLoading(true)
    try {
      await api.post<{ message: string; user: User }>(endpoints.register, {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      })

      await refresh()
      toast.success('Account created successfully! Please sign in with your credentials.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          New accounts start with the Sales Executive role. An admin can change it later.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <TextField id="name" label="Full name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Rohan Verma" />
          <TextField id="email" label="Work email" type="email" required value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="you@company.com" />
          <TextField id="phone" label="Phone" type="tel" required value={values.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" placeholder="+91 98200 11223" />
          <TextField id="password" label="Password" type="password" required value={values.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="Min 8 characters with upper, lower, number and symbol" />
          <TextField id="confirm" label="Confirm password" type="password" required value={values.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading && <Spinner data-icon="inline-start" />}
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </FieldGroup>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
