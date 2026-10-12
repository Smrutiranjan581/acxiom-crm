'use client'

import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ExtraAction {
  label: string
  icon: LucideIcon
  onClick: () => void
}

export function RowActions({
  onView,
  onEdit,
  onDelete,
  extra = [],
}: {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  extra?: ExtraAction[]
}) {
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontalIcon />
          <span className="sr-only">Open actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            {onView && (
              <DropdownMenuItem onClick={onView}>
                <EyeIcon />
                View details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
            )}
            {extra.map((a) => (
              <DropdownMenuItem key={a.label} onClick={a.onClick}>
                <a.icon />
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
