import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeftIcon, ShieldAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export const metadata: Metadata = { title: 'Access denied' }

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Empty className="max-w-md rounded-2xl border bg-card p-10 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <ShieldAlertIcon />
          </EmptyMedia>
          <p className="font-mono text-sm font-medium text-muted-foreground">403</p>
          <EmptyTitle className="text-xl">Access denied</EmptyTitle>
          <EmptyDescription>
            {"Your role doesn't have permission to view this page. Contact an administrator if you need access."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/dashboard" />} nativeButton={false}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
