import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet'

const toneClass: Record<Tone, string> = {
  blue: 'border-primary/20 bg-primary/10 text-primary',
  green: 'border-success/20 bg-success/10 text-success',
  amber: 'border-warning/25 bg-warning/10 text-warning',
  red: 'border-destructive/20 bg-destructive/10 text-destructive',
  gray: 'border-border bg-muted text-muted-foreground',
  violet: 'border-violet/20 bg-violet/10 text-violet',
}

const statusTone: Record<string, Tone> = {
  // Customer
  Active: 'green',
  Inactive: 'gray',
  Prospect: 'blue',
  Blocked: 'red',
  // Lead
  New: 'blue',
  Contacted: 'amber',
  Qualified: 'green',
  Unqualified: 'gray',
  Converted: 'violet',
  Lost: 'red',
  // Opportunity
  Qualification: 'blue',
  Proposal: 'amber',
  Negotiation: 'violet',
  Won: 'green',
  // Follow-up
  Planned: 'blue',
  Completed: 'green',
  Missed: 'red',
  Cancelled: 'gray',
  // Activity
  Pending: 'amber',
  'In Progress': 'blue',
  // Priority
  High: 'red',
  Medium: 'amber',
  Low: 'gray',
  // Roles
  Admin: 'violet',
  Manager: 'blue',
  SalesExecutive: 'green',
  // Audit
  Login: 'blue',
  Logout: 'gray',
  'Failed Login': 'red',
  Create: 'green',
  Update: 'amber',
  Delete: 'red',
  'Role Change': 'violet',
  // Account
  Locked: 'red',
  Unlocked: 'green',
}

export function StatusBadge({
  status,
  label,
  dot = true,
  className,
}: {
  status: string
  label?: string
  dot?: boolean
  className?: string
}) {
  const tone = statusTone[status] ?? 'gray'
  return (
    <Badge variant="outline" className={cn('font-medium', toneClass[tone], className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {label ?? (status === 'SalesExecutive' ? 'Sales Executive' : status)}
    </Badge>
  )
}
