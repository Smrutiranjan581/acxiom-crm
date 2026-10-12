'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { useCrm } from '@/components/providers/crm-provider'
import { firstError, rules } from '@/lib/validation'
import { api, endpoints } from '@/services/api'
import type { User } from '@/types'

const DEMO_PASSWORD = 'Demo@123'

export function LoginForm() {
  const router = useRouter()
  const { signIn, refresh } = useCrm()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = {
      email: firstError(rules.required(email, 'Email'), rules.email(email)),
      password: rules.required(password, 'Password'),
    }
    setErrors(next)
    setFormError(null)
    if (next.email || next.password) return

    setLoading(true)

    try {
      const res = await api.post<{ user: User; message: string }>(endpoints.login, {
        email: email.trim(),
        password,
      })

      signIn(res.user.id)
      await refresh()
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`)
      router.push('/dashboard')
    } catch (err: any) {
      setFormError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(userEmail: string) {
    setEmail(userEmail)
    setPassword(DEMO_PASSWORD)
    setErrors({})
    setFormError(null)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
        <p className="text-sm text-muted-foreground">Enter your work email and password to continue.</p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <InputGroup className="bg-card">
              <InputGroupAddon>
                <MailIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email || undefined}
              />
            </InputGroup>
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.password || undefined}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => toast.info('Password reset requests can be fulfilled by the Administrator.')}
              >
                Forgot password?
              </button>
            </div>
            <InputGroup className="bg-card">
              <InputGroupAddon>
                <LockIcon />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password || undefined}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="remember" defaultChecked />
            <FieldLabel htmlFor="remember" className="font-normal">
              Keep me signed in
            </FieldLabel>
          </Field>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading && <Spinner data-icon="inline-start" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          Demo accounts · password <code className="font-mono text-foreground">{DEMO_PASSWORD}</code>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Admin', 'aarav.mehta@acxiomcrm.com'],
            ['Manager', 'priya.sharma@acxiomcrm.com'],
            ['Sales', 'rohan.verma@acxiomcrm.com'],
          ].map(([label, mail]) => (
            <Button key={label} type="button" variant="outline" size="sm" onClick={() => fillDemo(mail)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
