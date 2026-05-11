'use client';

import { Toaster } from 'sonner';

/** Sonner instance for admin routes: dark surfaces, no harsh “rich” error pink. */
export function AdminToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      closeButton
      offset={14}
      toastOptions={{
        classNames: {
          toast:
            '!rounded-xl !border !border-white/[0.08] !bg-[#131920] !text-[#e8edf4] !shadow-[0_18px_48px_-14px_rgba(0,0,0,0.75)]',
          title: '!text-[13px] !font-semibold !text-[#f4f7fb]',
          description:
            '!mt-0.5 !text-[12px] !leading-relaxed !text-[#b8c4d4] [unicode-bidi:plaintext]',
          error: '!border-red-500/25 !bg-[#1a1416]',
          success: '!border-emerald-500/20 !bg-[#121a17]',
          warning: '!border-amber-500/25 !bg-[#1a1812]',
          closeButton:
            '!border-0 !bg-white/[0.06] !text-[#e8edf4] hover:!bg-white/12 [&_svg]:!opacity-80',
        },
      }}
    />
  );
}
