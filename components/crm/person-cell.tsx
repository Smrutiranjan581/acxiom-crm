import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const palette = [
  'bg-primary/10 text-primary',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-violet/10 text-violet',
]

export function PersonCell({
  name,
  subtitle,
  size = 'default',
}: {
  name: string
  subtitle?: string
  size?: 'sm' | 'default'
}) {
  const color = palette[name.charCodeAt(0) % palette.length]
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={size === 'sm' ? 'size-7' : 'size-9'}>
        <AvatarFallback className={cn('text-xs font-semibold', color)}>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  )
}
