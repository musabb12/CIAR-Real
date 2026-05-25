import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EstateHeading } from '@/components/estate/estate-heading';

type BrandIconProps = {
  className?: string;
};

const VB_W = 64;
const VB_H = 40;

function IconShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={cn('h-12 w-[4.75rem] sm:h-14 sm:w-[5.75rem] shrink-0 drop-shadow-sm', className)}
      role="img"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function VisaIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#1A1F71" />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        fill="#fff"
        fontSize="15"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        VISA
      </text>
    </IconShell>
  );
}

function MastercardIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#1a1a1a" />
      <circle cx="25" cy="20" r="12" fill="#EB001B" />
      <circle cx="39" cy="20" r="12" fill="#F79E1B" />
    </IconShell>
  );
}

function AmexIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#006FCF" />
      <text
        x="32"
        y="26"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.5"
      >
        AMEX
      </text>
    </IconShell>
  );
}

function PaypalIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#003087" />
      <text
        x="32"
        y="26"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        PayPal
      </text>
    </IconShell>
  );
}

function ApplePayIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#000" />
      <path
        fill="#fff"
        d="M18 11.5c.1-1.5 1.3-2.8 2.7-2.6.2 1.4-1 2.8-2.7 2.6zm2.4 1.6c-2.3-.1-4.2 1.3-5.3 1.3-1.1 0-2.7-1.2-4.4-1.2-2.3 0-4.5 1.3-5.6 3.4-2.4 4.2-.7 10.4 1.7 13.8 1.1 1.7 2.5 3.4 4.3 3.2 1.8-.1 2.4-1.1 4.5-1.1 2.1 0 2.6 1.1 4.5 1 1.9-.1 3.1-1.7 4.2-3.3.7-1.1.9-1.7 1.4-1.7.5 0 3.6 1.3 4.1-5.1-5-.8-5.2-6.4-3-7.4z"
        transform="translate(8 2) scale(0.95)"
      />
      <text
        x="40"
        y="26"
        fill="#fff"
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        Pay
      </text>
    </IconShell>
  );
}

function GooglePayIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#fff" stroke="#D1D5DB" strokeWidth="1" />
      <text x="14" y="27" fontSize="14" fontWeight="800" fontFamily="Arial, Helvetica, sans-serif">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC05">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
      </text>
      <text
        x="48"
        y="27"
        fill="#5F6368"
        fontSize="10"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        Pay
      </text>
    </IconShell>
  );
}

function MadaIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#00A651" />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        fill="#fff"
        fontSize="14"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        mada
      </text>
    </IconShell>
  );
}

function StcPayIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#4F008C" />
      <text
        x="32"
        y="19"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        stc
      </text>
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fill="#FF375E"
        fontSize="11"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        pay
      </text>
    </IconShell>
  );
}

function WhishIcon({ className }: BrandIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/payments/whish.png"
      alt="Whish Money"
      className={cn(
        'h-12 w-auto max-w-[5.75rem] sm:h-14 object-contain rounded-md shrink-0 drop-shadow-sm',
        className,
      )}
    />
  );
}

function CiarPrepaidIcon({ className }: BrandIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/payments/ciar-prepaid.png"
      alt="CIAR Prepaid"
      className={cn(
        'h-12 w-auto max-w-[5.75rem] sm:h-14 object-contain rounded-md shrink-0 drop-shadow-md',
        className,
      )}
    />
  );
}

function BankTransferIcon({ className }: BrandIconProps) {
  return (
    <IconShell className={className}>
      <rect width={VB_W} height={VB_H} rx="5" fill="#0F766E" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 28V17l20-8 20 8v11"
      />
      <path fill="#fff" d="M26 23h12v6H26z" />
      <rect x="22" y="18" width="4" height="5" fill="#fff" rx="0.5" />
      <rect x="36" y="18" width="4" height="5" fill="#fff" rx="0.5" />
      <rect x="29" y="25" width="6" height="4" fill="#0F766E" rx="0.5" />
    </IconShell>
  );
}

export type PaymentBrand = {
  id: string;
  name: string;
  Icon: (props: BrandIconProps) => ReactNode;
};

export const PAYMENT_BRANDS: PaymentBrand[] = [
  { id: 'visa', name: 'Visa', Icon: VisaIcon },
  { id: 'mastercard', name: 'Mastercard', Icon: MastercardIcon },
  { id: 'amex', name: 'American Express', Icon: AmexIcon },
  { id: 'paypal', name: 'PayPal', Icon: PaypalIcon },
  { id: 'apple-pay', name: 'Apple Pay', Icon: ApplePayIcon },
  { id: 'google-pay', name: 'Google Pay', Icon: GooglePayIcon },
  { id: 'mada', name: 'mada', Icon: MadaIcon },
  { id: 'stc-pay', name: 'STC Pay', Icon: StcPayIcon },
  { id: 'bank-transfer', name: 'Bank Transfer', Icon: BankTransferIcon },
  { id: 'whish', name: 'Whish Money', Icon: WhishIcon },
  { id: 'ciar-prepaid', name: 'CIAR Prepaid', Icon: CiarPrepaidIcon },
];

/** Lookup brand by id (checkout, admin, etc.) */
export function getPaymentBrand(id: string): PaymentBrand | undefined {
  return PAYMENT_BRANDS.find((b) => b.id === id);
}

type PaymentMethodsShowcaseProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'estate';
};

export function PaymentMethodsShowcase({
  className,
  title,
  subtitle,
  variant = 'default',
}: PaymentMethodsShowcaseProps) {
  const isEstate = variant === 'estate';

  return (
    <section className={cn('px-4', isEstate ? 'estate-band estate-band--muted' : 'py-16 sm:py-20', className)}>
      <div className="max-w-6xl mx-auto text-center">
        {title && isEstate ? (
          <EstateHeading align="center" title={title} subtitle={subtitle} />
        ) : (
          <>
            {title ? (
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="text-muted-foreground mb-10 sm:mb-12 max-w-2xl mx-auto text-base">
                {subtitle}
              </p>
            ) : null}
          </>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-lg sm:max-w-4xl mx-auto">
          {PAYMENT_BRANDS.map((brand) => (
            <li
              key={brand.id}
              className={cn(
                'flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all',
                isEstate
                  ? 'estate-surface px-3 py-5 sm:py-6'
                  : 'glass-card rounded-2xl px-3 py-5 sm:py-6 hover-lift-glow border border-border/40 bg-card/80',
              )}
              title={brand.name}
            >
              <brand.Icon />
              <span className="text-xs sm:text-sm font-semibold text-foreground/80 leading-tight text-center">
                {brand.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
