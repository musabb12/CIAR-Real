'use client';

import { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteCurrency } from '@/hooks/use-site-currency';
import type { SiteCurrencyCode } from '@/lib/site-currency';
import { cn } from '@/lib/utils';

interface CurrencySwitcherProps {
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  /** Show currency code label beside icon (desktop). */
  showCode?: boolean;
  variant?: 'site' | 'admin';
}

export function CurrencySwitcher({
  className,
  buttonClassName,
  menuClassName,
  showCode = true,
  variant = 'site',
}: CurrencySwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { displayCurrency, setDisplayCurrency, currencies, getCurrencyName } = useSiteCurrency();

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onOutside);
    return () => document.removeEventListener('click', onOutside);
  }, [open]);

  const isAdmin = variant === 'admin';

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          isAdmin
            ? 'admin-icon-btn !h-9 !w-auto gap-1.5 px-2.5'
            : 'h-8 gap-1.5 rounded-lg px-2.5 text-[13px] font-medium',
          buttonClassName,
        )}
        title={displayCurrency}
      >
        <Coins className={cn('h-3.5 w-3.5', isAdmin ? '' : 'text-muted-foreground')} />
        {showCode && (
          <span className={cn('hidden sm:inline text-xs font-semibold', isAdmin && 'text-[var(--admin-text)]')}>
            {displayCurrency}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            'absolute end-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] w-52 overflow-y-auto rounded-xl p-1',
            isAdmin
              ? 'admin-card border border-white/10 shadow-2xl admin-scrollbar'
              : 'glass-deep admin-scrollbar',
            menuClassName,
          )}
        >
          {currencies.map((code) => (
            <button
              key={code}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDisplayCurrency(code as SiteCurrencyCode);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors text-start',
                code === displayCurrency
                  ? isAdmin
                    ? 'bg-amber-500/15 font-semibold text-amber-300'
                    : 'bg-gradient-to-r from-amber-500/10 to-emerald-500/10 font-semibold text-amber-700 dark:text-amber-400'
                  : isAdmin
                    ? 'text-[var(--admin-text-mute)] hover:bg-white/5 hover:text-[var(--admin-text)]'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white',
              )}
            >
              <span
                className={cn(
                  'flex h-6 min-w-[2rem] items-center justify-center rounded-md px-1 text-[10px] font-bold uppercase tracking-wider',
                  code === displayCurrency
                    ? 'bg-gradient-to-br from-amber-500 to-emerald-500 text-white'
                    : isAdmin
                      ? 'bg-white/10 text-[var(--admin-text-faint)]'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
                )}
              >
                {code}
              </span>
              <span className="flex-1 truncate">{getCurrencyName(code)}</span>
              {code === displayCurrency && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
