'use client';

import type { ReactNode } from 'react';
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Youtube,
} from 'lucide-react';
import type { SocialLinkItem, SocialPlatformKey } from '@/lib/social-links';
import { cn } from '@/lib/utils';

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

function IconSnapchat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.049.509.135.203.12.313.322.313.57 0 .345-.27.66-.749.852-.23.092-.445.135-.645.135-.194 0-.356-.04-.483-.104-.1-.052-.24-.03-.356.06-.45.39-1.01.645-1.61.75-.24.045-.45.075-.63.09-.18.015-.33.015-.45 0-.12-.015-.27-.045-.45-.09-.6-.105-1.16-.36-1.61-.75-.116-.09-.256-.112-.356-.06-.127.064-.289.104-.483.104-.2 0-.415-.043-.645-.135-.479-.192-.749-.507-.749-.852 0-.248.11-.45.313-.57.15-.086.327-.135.509-.135.12 0 .299.016.464.104.374.181.733.285 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.853 1.069 11.216.793 12.206.793z" />
    </svg>
  );
}

function IconThreads({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.186 2.5c-2.46 0-4.44 1.98-4.44 4.42 0 .9.27 1.74.73 2.44-.46.7-.73 1.54-.73 2.44 0 2.44 1.98 4.42 4.44 4.42.9 0 1.74-.27 2.44-.73.7.46 1.54.73 2.44.73 2.44 0 4.42-1.98 4.42-4.42 0-.9-.27-1.74-.73-2.44.46-.7.73-1.54.73-2.44 0-2.44-1.98-4.42-4.42-4.42-.9 0-1.74.27-2.44.73-.7-.46-1.54-.73-2.44-.73zm0 1.8a2.62 2.62 0 1 1 0 5.24 2.62 2.62 0 0 1 0-5.24zm4.44 7.04a2.62 2.62 0 1 1 0 5.24 2.62 2.62 0 0 1 0-5.24zM7.746 10.54a2.62 2.62 0 1 1 0 5.24 2.62 2.62 0 0 1 0-5.24z" />
    </svg>
  );
}

function IconPinterest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.599-.299-1.484c0-1.391.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.481 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.744 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.292-1.155l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.936.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

function socialIcon(key: SocialPlatformKey, className: string): ReactNode {
  switch (key) {
    case 'website':
      return <Globe className={className} />;
    case 'email':
      return <Mail className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'whatsapp':
      return <MessageCircle className={className} />;
    case 'telegram':
      return <Send className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'x':
      return <IconX className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'tiktok':
      return <IconTikTok className={className} />;
    case 'snapchat':
      return <IconSnapchat className={className} />;
    case 'threads':
      return <IconThreads className={className} />;
    case 'pinterest':
      return <IconPinterest className={className} />;
    default:
      return <Globe className={className} />;
  }
}

interface SocialLinksBarProps {
  items: SocialLinkItem[];
  isAr?: boolean;
  variant?: 'footer' | 'contact';
  className?: string;
  emptyMessage?: string;
}

export function SocialLinksBar({
  items,
  isAr = false,
  variant = 'contact',
  className,
  emptyMessage,
}: SocialLinksBarProps) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  const linkClass =
    variant === 'footer'
      ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-400'
      : 'flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-600 transition-all hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-amber-400';

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isAr ? item.labelAr : item.labelEn}
          title={isAr ? item.labelAr : item.labelEn}
          className={linkClass}
        >
          {socialIcon(item.key, 'h-4 w-4')}
        </a>
      ))}
    </div>
  );
}
