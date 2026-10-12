'use client'

import { useState } from 'react'
import { KeyRoundIcon, LockOpenIcon, ShieldAlertIcon, ShieldCheckIcon, UserCheckIcon, UserPlusIcon, UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KpiCard } from '@/components/crm/kpi-card'
import { PageHeader } from '@/components/layout/page-header'
import { PersonCell } from '@/components/crm/person-cell'
import { StatusBadge } from '@/components/crm/status-badge'
import { useCrm } from '@/components/providers/crm-provider'
import { formatDate } from '@/lib/format'
import { api, endpoints } from '@/services/api'
import type { Role, User } from '@/types'

export function AdminUsersView() {
  const { users, refresh } = useCrm()
  const [openCreate, setOpenCreate] = useState(false)
  const [openPasswordReset, setOpenPasswordReset] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'SalesExecutive' as Role,
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const activeCount = users.filter((u) => u.active).length
  const lockedCount = users.filter((u) => u.lockedOut).length

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post(endpoints.users, createData)
      toast.success(`User ${createData.name} created successfully`)
      setOpenCreate(false)
      setCreateData({ name: '', email: '', phone: '', role: 'SalesExecutive', password: '' })
      await refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(user: User) {
    try {
      await api.put(`${endpoints.users}/${user.id}`, { active: !user.active })
      toast.success(`User ${user.name} is now ${!user.active ? 'Active' : 'Inactive'}`)
      await refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status')
    }
  }

  async function handleUnlock(user: User) {
    try {
      await api.put(`${endpoints.users}/${user.id}`, { unlock: true })
      toast.success(`User ${user.name} unlocked successfully`)
      await refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock user')
    }
  }

  async function handleChangeRole(user: User, newRole: Role) {
    try {
      await api.put(`${endpoints.users}/${user.id}`, { role: newRole })
      toast.success(`Role for ${user.name} updated to ${newRole}`)
      await refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!openPasswordReset || !newPassword) return
    setSubmitting(true)
    try {
      await api.put(`${endpoints.users}/${openPasswordReset.id}`, { password: newPassword })
      toast.success(`Password reset for ${openPasswordReset.name}`)
      setOpenPasswordReset(null)
      setNewPassword('')
      await refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="User Administration"
        description="Manage application users, assign roles, inspect account lockout status, and reset passwords."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        actions={
          <Button onClick={() => setOpenCreate(true)}>
            <UserPlusIcon data-icon="inline-start" />
            Add user
          </Button>
        }
      />

      <section aria-label="User metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={users.length} icon={UsersIcon} tone="blue" />
        <KpiCard label="Active Accounts" value={activeCount} icon={UserCheckIcon} tone="green" />
        <KpiCard label="Locked Out Accounts" value={lockedCount} icon={ShieldAlertIcon} tone={lockedCount > 0 ? 'red' : 'green'} hint={lockedCount > 0 ? 'Requires admin unlock' : 'No locked accounts'} />
        <KpiCard label="Security Roles" value="3 Roles" icon={ShieldCheckIcon} tone="violet" hint="Admin · Manager · Sales" />
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs uppercase text-muted-foreground border-y">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lockout</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      <PersonCell name={u.name} subtitle={u.phone} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.lockedOut ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                          <ShieldAlertIcon className="size-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Normal</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                          Options
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Role Administration</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleChangeRole(u, 'Admin')}>Assign Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(u, 'Manager')}>Assign Manager</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(u, 'SalesExecutive')}>Assign Sales Executive</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.lockedOut && (
                            <DropdownMenuItem onClick={() => handleUnlock(u)}>
                              <LockOpenIcon className="size-4 mr-2" /> Unlock Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setOpenPasswordReset(u)}>
                            <KeyRoundIcon className="size-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                            {u.active ? 'Deactivate Account' : 'Activate Account'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Application User</DialogTitle>
            <DialogDescription>Create a new CRM user and assign an initial security role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div>
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                required
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                placeholder="Rohan Sharma"
              />
            </div>
            <div>
              <Label htmlFor="create-email">Work Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                placeholder="rohan@acxiomcrm.com"
              />
            </div>
            <div>
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={createData.phone}
                onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                placeholder="+91 98200 12345"
              />
            </div>
            <div>
              <Label htmlFor="create-role">Primary Role</Label>
              <select
                id="create-role"
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value as Role })}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="Admin">Admin (Full Access & Security Admin)</option>
                <option value="Manager">Manager (Team Management & Reports)</option>
                <option value="SalesExecutive">Sales Executive (Assigned Records Only)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="create-password">Initial Password</Label>
              <Input
                id="create-password"
                type="password"
                required
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                placeholder="Min 8 chars with upper, number, symbol"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!openPasswordReset} onOpenChange={(o) => !o && setOpenPasswordReset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password for {openPasswordReset?.name}</DialogTitle>
            <DialogDescription>Enter a new secure password meeting policy requirements.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div>
              <Label htmlFor="reset-pass">New Password</Label>
              <Input
                id="reset-pass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars (e.g. Demo@123)"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenPasswordReset(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Updating...' : 'Save Password'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
