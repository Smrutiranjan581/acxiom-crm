'use client'

import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/crm/status-badge'
import { PersonCell } from '@/components/crm/person-cell'
import { useCrm } from '@/components/providers/crm-provider'
import { OPEN_STAGES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/format'

export function TopDeals() {
  const { opportunities, scoped, relatedName, userName } = useCrm()
  const deals = scoped(opportunities)
    .filter((o) => (OPEN_STAGES as readonly string[]).includes(o.stage))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top open opportunities</CardTitle>
        <CardDescription>Highest-value deals still in play</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/opportunities" />} nativeButton={false}>
            View pipeline
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Opportunity</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead className="hidden lg:table-cell">Probability</TableHead>
              <TableHead className="hidden sm:table-cell">Close date</TableHead>
              <TableHead className="pr-6 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No open opportunities yet.
                </TableCell>
              </TableRow>
            )}
            {deals.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="pl-6">
                  <Link href={`/opportunities/${o.id}`} className="flex flex-col hover:underline">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">{relatedName('Customer', o.customerId)}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.stage} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <PersonCell name={userName(o.ownerId)} size="sm" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex w-28 items-center gap-2">
                    <Progress value={o.probability} className="h-1.5" aria-label="Win probability" />
                    <span className="text-xs tabular-nums text-muted-foreground">{o.probability}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(o.expectedCloseDate)}</TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">{formatCurrency(o.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
