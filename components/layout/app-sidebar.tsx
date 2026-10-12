'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  TargetIcon,
  UsersIcon,
  UserCogIcon,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useCrm } from '@/components/providers/crm-provider'
import type { Role } from '@/types'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  roles?: Role[]
  badgeKey?: 'overdue'
}

const mainNav: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { title: 'Customers', href: '/customers', icon: UsersIcon },
  { title: 'Leads', href: '/leads', icon: TargetIcon },
  { title: 'Opportunities', href: '/opportunities', icon: HandshakeIcon },
  { title: 'Follow-Ups', href: '/follow-ups', icon: CalendarClockIcon, badgeKey: 'overdue' },
  { title: 'Activities', href: '/activities', icon: ActivityIcon },
  { title: 'Reports', href: '/reports', icon: BarChart3Icon },
]

const adminNav: NavItem[] = [
  { title: 'Users', href: '/admin/users', icon: UserCogIcon, roles: ['Admin'] },
  { title: 'Roles', href: '/admin/roles', icon: ShieldCheckIcon, roles: ['Admin'] },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardListIcon, roles: ['Admin'] },
]

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-1.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
        A
      </span>
      <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-semibold text-sidebar-accent-foreground">AcxiomCRM</span>
        <span className="text-xs text-sidebar-foreground/60">Sales workspace</span>
      </span>
    </Link>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { can, scoped, followUps } = useCrm()
  const overdue = scoped(followUps).filter((f) => f.status === 'Missed').length

  const renderItems = (items: NavItem[]) =>
    items
      .filter((item) => !item.roles || can(...item.roles))
      .map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={active}
              tooltip={item.title}
              render={<Link href={item.href} />}
              className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.badgeKey === 'overdue' && overdue > 0 && (
              <SidebarMenuBadge className="rounded-full bg-destructive/90 text-white">{overdue}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {can('Admin') && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(adminNav)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">Q4 target progress</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sidebar-border">
            <div className="h-full w-[68%] rounded-full bg-sidebar-primary" />
          </div>
          <p className="mt-2 text-xs text-sidebar-foreground/60">68% of ₹1.2 Cr achieved</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
