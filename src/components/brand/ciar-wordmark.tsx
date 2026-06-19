'use client';

import { cn } from '@/lib/utils';

export type CiarWordmarkProps = {
  className?: string;
  /** Display size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual style */
  variant?: 'luxury' | 'light' | 'admin' | 'plain';
};

const sizeMap = {
  sm: 'text-lg sm:text-xl',
  md: 'text-2xl sm:text-[1.65rem]',
  lg: 'text-3xl sm:text-4xl',
  xl: 'text-4xl sm:text-5xl lg:text-[3.25rem]',
};

const taglineSizeMap = {
  sm: 'text-[9px] sm:text-[10px]',
  md: 'text-[10px] sm:text-[11px]',
  lg: 'text-[11px] sm:text-xs',
  xl: 'text-xs sm:text-[13px]',
};

export function CiarWordmark({
  className,
  size = 'md',
  variant = 'luxury',
}: CiarWordmarkProps) {
  return (
    <span
      className={cn(
        'ciar-wordmark inline-block font-normal lowercase leading-none',
        sizeMap[size],
        variant === 'luxury' && 'ciar-wordmark--luxury',
        variant === 'light' && 'ciar-wordmark--light',
        variant === 'admin' && 'admin-text-gradient',
        variant === 'plain' && 'text-foreground',
        className,
      )}
      aria-label="CIAR"
    >
      ciar
    </span>
  );
}

export type CiarBrandLockupProps = CiarWordmarkProps & {
  showTagline?: boolean;
  tagline?: string;
  align?: 'start' | 'center';
};

/** Logo + optional "Real Estate" tagline */
export function CiarBrandLockup({
  className,
  size = 'md',
  variant = 'luxury',
  showTagline = true,
  tagline = 'Real Estate',
  align = 'start',
}: CiarBrandLockupProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-col',
        align === 'center' ? 'items-center' : 'items-start',
        className,
      )}
    >
      <CiarWordmark size={size} variant={variant} />
      {showTagline ? (
        <span
          className={cn(
            'ciar-tagline mt-1.5',
            taglineSizeMap[size],
            variant === 'luxury' && 'ciar-tagline--luxury',
            variant === 'light' && 'ciar-tagline--light',
            variant === 'admin' && 'ciar-tagline--admin',
            variant === 'plain' && 'ciar-tagline--plain',
          )}
        >
          {tagline}
        </span>
      ) : null}
    </span>
  );
}
