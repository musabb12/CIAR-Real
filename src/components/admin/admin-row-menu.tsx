'use client';

import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RowAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export function AdminRowMenu({
  actions,
  ariaLabel,
}: {
  actions: RowAction[];
  ariaLabel?: string;
}) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? 'Row actions'}
          className="admin-icon-btn !h-8 !w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[10rem] border-white/10 bg-[#0e1522]/95 text-white backdrop-blur"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-white/50">
          {ariaLabel ?? 'Actions'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <DropdownMenuItem
              key={a.id}
              disabled={a.disabled}
              onSelect={(e) => {
                e.preventDefault();
                void a.onClick();
              }}
              className={
                a.variant === 'danger'
                  ? 'text-rose-300 focus:!text-rose-200 focus:!bg-rose-500/10'
                  : 'focus:!bg-white/5'
              }
            >
              {Icon ? <Icon className="me-2 h-3.5 w-3.5" /> : null}
              {a.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
