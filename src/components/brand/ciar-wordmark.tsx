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
