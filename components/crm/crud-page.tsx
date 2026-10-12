'use client'

import { useState } from 'react'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/crm/confirm-dialog'
import { DataTable, type Column, type FilterDef } from '@/components/crm/data-table'
import { RecordSheet, type FieldDef, type FormValues } from '@/components/crm/record-sheet'
import { RowActions, type ExtraAction } from '@/components/crm/row-actions'
import { PageHeader } from '@/components/layout/page-header'

export function CrudPage<T extends { id: string }>({
  title,
  description,
  singular,
  rows,
  columns,
  filters,
  searchFn,
  searchPlaceholder,
  fields,
  toForm,
  onSave,
  onDelete,
  canCreate = true,
  canDelete = false,
  extraActions,
  openNew = false,
  initialQuery,
  summary,
}: {
  title: string
  description: string
  singular: string
  rows: T[]
  columns: Column<T>[]
  filters?: FilterDef<T>[]
  searchFn?: (row: T, q: string) => boolean
  searchPlaceholder?: string
  fields: FieldDef[]
  toForm: (row?: T) => FormValues
  onSave: (values: FormValues, existing?: T) => void
  onDelete?: (row: T) => void
  canCreate?: boolean
  canDelete?: boolean
  extraActions?: (row: T) => ExtraAction[]
  openNew?: boolean
  initialQuery?: string
  summary?: React.ReactNode
}) {
  const [editing, setEditing] = useState<T | undefined>()
  const [open, setOpen] = useState(openNew)
  const [deleting, setDeleting] = useState<T | undefined>()

  const openSheet = (row?: T) => {
    setEditing(row)
    setOpen(true)
  }

  const exportCsv = () => {
    const header = columns.map((c) => c.header).filter(Boolean)
    const body = rows.map((r) =>
      columns
        .filter((c) => c.header)
        .map((c) => `"${String(c.sortValue?.(r) ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} ${title.toLowerCase()}`)
  }

  const allColumns: Column<T>[] = [
    ...columns,
    {
      id: 'actions',
      header: '',
      className: 'w-12 text-right',
      cell: (row) => (
        <RowActions
          onEdit={() => openSheet(row)}
          onDelete={canDelete && onDelete ? () => setDeleting(row) : undefined}
          extra={extraActions?.(row)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: title }]}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            {canCreate && (
              <Button onClick={() => openSheet()}>
                <PlusIcon data-icon="inline-start" />
                Add {singular.toLowerCase()}
              </Button>
            )}
          </>
        }
      />

      {summary}

      <Card className="py-0">
        <CardContent className="p-0">
          <DataTable
            data={rows}
            columns={allColumns}
            filters={filters}
            searchFn={searchFn}
            searchPlaceholder={searchPlaceholder}
            initialQuery={initialQuery}
            emptyTitle={`No ${title.toLowerCase()} found`}
          />
        </CardContent>
      </Card>

      <RecordSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
        description={editing ? 'Update the details below and save your changes.' : `Fill in the details to create a new ${singular.toLowerCase()}.`}
        fields={fields}
        initial={toForm(editing)}
        submitLabel={editing ? 'Save changes' : `Create ${singular.toLowerCase()}`}
        onSubmit={(values) => {
          onSave(values, editing)
          setOpen(false)
          toast.success(editing ? `${singular} updated` : `${singular} created`)
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title={`Delete ${singular.toLowerCase()}?`}
        description="This action cannot be undone. The record will be permanently removed."
        onConfirm={() => {
          if (deleting && onDelete) onDelete(deleting)
          setDeleting(undefined)
          toast.success(`${singular} deleted`)
        }}
      />
    </>
  )
}
