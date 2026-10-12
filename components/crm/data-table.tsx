'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppSelect, toOptions } from '@/components/forms/app-select'
import { cn } from '@/lib/utils'

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

export interface FilterDef<T> {
  id: string
  label: string
  options: readonly string[]
  getValue: (row: T) => string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  searchFn,
  filters = [],
  initialQuery = '',
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  onRowClick,
  toolbar,
}: {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchFn?: (row: T, query: string) => boolean
  filters?: FilterDef<T>[]
  initialQuery?: string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  toolbar?: React.ReactNode
}) {
  const [query, setQuery] = useState(initialQuery)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data.filter((row) => {
      if (q && searchFn && !searchFn(row, q)) return false
      return filters.every((f) => !filterValues[f.id] || f.getValue(row) === filterValues[f.id])
    })
    if (sort) {
      const col = columns.find((c) => c.id === sort.id)
      if (col?.sortValue) {
        const get = col.sortValue
        rows = [...rows].sort((a, b) => {
          const av = get(a)
          const bv = get(b)
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
          return sort.dir === 'asc' ? cmp : -cmp
        })
      }
    }
    return rows
  }, [data, query, searchFn, filters, filterValues, sort, columns])

  const pageCount = Math.max(1, Math.ceil(processed.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasActiveFilters = query !== '' || Object.values(filterValues).some(Boolean)

  function toggleSort(id: string) {
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: 'asc' }
      if (prev.dir === 'asc') return { id, dir: 'desc' }
      return null
    })
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
        {searchFn && (
          <InputGroup className="lg:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </InputGroup>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <AppSelect
              key={f.id}
              size="sm"
              ariaLabel={`Filter by ${f.label}`}
              className="w-auto min-w-36"
              placeholder={`All ${f.label.toLowerCase()}`}
              items={toOptions(f.options)}
              value={filterValues[f.id] ?? ''}
              onValueChange={(v) => {
                setFilterValues((prev) => ({ ...prev, [f.id]: v }))
                setPage(1)
              }}
            />
          ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setFilterValues({})
                setPage(1)
              }}
            >
              <XIcon data-icon="inline-start" />
              Reset
            </Button>
          )}
        </div>
        {toolbar && <div className="flex items-center gap-2 lg:ml-auto">{toolbar}</div>}
      </div>

      {pageRows.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn('h-11 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:pl-4 last:pr-4', col.className)}
                  aria-sort={
                    sort?.id === col.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.id)}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      {col.header}
                      {sort?.id === col.id ? (
                        sort.dir === 'asc' ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="size-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} className={cn('py-3 first:pl-4 last:pr-4', col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
        <p>
          Showing{' '}
          <span className="font-medium text-foreground">
            {processed.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, processed.length)}
          </span>{' '}
          of <span className="font-medium text-foreground">{processed.length}</span> records
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setPage(n)}
              aria-current={n === currentPage ? 'page' : undefined}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Button>
        </nav>
      </div>
    </Card>
  )
}
