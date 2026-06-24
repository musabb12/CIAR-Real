'use client';

import { resolveFlagImageUrl } from '@/lib/country-flags';
import { useLocalizedCountryName } from '@/hooks/use-localized-country-name';
import type { LocalizableCountry } from '@/lib/localize-country';
import { cn } from '@/lib/utils';

type CountryFlagLabelProps = {
  country: LocalizableCountry & { flag?: string | null };
  className?: string;
  flagClassName?: string;
  labelClassName?: string;
};

/** Flag image + localized country name (replaces ISO code prefix in lists). */
export function CountryFlagLabel({
  country,
  className,
  flagClassName,
  labelClassName,
}: CountryFlagLabelProps) {
  const countryLabel = useLocalizedCountryName();
  const url = resolveFlagImageUrl(country.flag, country.code ?? country.id);

  return (
    <span className={cn('inline-flex items-center gap-2 min-w-0', className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={24}
          height={16}
          className={cn(
            'h-4 w-6 shrink-0 rounded object-cover border border-black/10 dark:border-white/15',
            flagClassName,
          )}
          loading="lazy"
        />
      ) : (
        <span
          className={cn(
            'h-4 w-6 shrink-0 rounded bg-muted/50 border border-border/40',
            flagClassName,
          )}
          aria-hidden
        />
      )}
      <span className={cn('truncate', labelClassName)}>{countryLabel(country)}</span>
    </span>
  );
}
