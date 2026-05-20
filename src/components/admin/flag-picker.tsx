'use client';

import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import {
  flagImageUrl,
  listWorldFlagOptions,
  resolveFlagImageUrl,
} from '@/lib/country-flags';
import { cn } from '@/lib/utils';

interface FlagPickerProps {
  value: string;
  countryCode?: string;
  onChange: (isoCode: string) => void;
  isAr: boolean;
  className?: string;
}

export function FlagPicker({ value, countryCode, onChange, isAr, className }: FlagPickerProps) {
  const [query, setQuery] = useState('');
  const locale = isAr ? 'ar' : 'en';
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const options = useMemo(() => listWorldFlagOptions(locale), [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selectedCode = (value || countryCode || '').toUpperCase();
  const previewUrl = resolveFlagImageUrl(value, countryCode);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            width={40}
            height={28}
            className="h-7 w-10 rounded object-cover border border-white/10 shadow-sm"
          />
        ) : (
          <div className="h-7 w-10 rounded bg-white/10 border border-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--admin-text-faint)]">
            {tx('العلم المختار', 'Selected flag')}
          </p>
          <p className="text-sm font-semibold truncate">
            {selectedCode || tx('لم يُختر بعد', 'Not selected')}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tx('ابحث بالاسم أو الرمز…', 'Search by name or code…')}
          className="admin-input h-10 w-full ps-10"
        />
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {filtered.map((opt) => {
            const selected = opt.code === selectedCode;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => onChange(opt.code)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-2 text-start text-xs transition-colors',
                  selected
                    ? 'bg-amber-500/20 border border-amber-400/40'
                    : 'hover:bg-white/5 border border-transparent',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagImageUrl(opt.code, 40)}
                  alt=""
                  width={32}
                  height={22}
                  className="h-[22px] w-8 shrink-0 rounded object-cover border border-white/10"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1 truncate font-medium">{opt.name}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-[var(--admin-text-faint)]">
            {tx('لا توجد نتائج', 'No results')}
          </p>
        )}
      </div>
    </div>
  );
}

export function CountryFlagBadge({
  flag,
  code,
  size = 'md',
}: {
  flag?: string | null;
  code?: string;
  size?: 'sm' | 'md';
}) {
  const url = resolveFlagImageUrl(flag, code);
  const dim = size === 'sm' ? 'h-5 w-7' : 'h-7 w-10';
  if (!url) {
    return <span className={cn(dim, 'inline-flex rounded bg-white/10 border border-white/10')} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn(dim, 'rounded object-cover border border-white/10 shrink-0')}
    />
  );
}
