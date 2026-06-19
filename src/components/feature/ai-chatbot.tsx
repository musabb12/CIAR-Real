'use client';

import { useMemo, useState } from 'react';
import { MessageCircle, X, Send, Phone, Mail, Search } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const { socialSettings, setCurrentPage } = useAppStore();
  const { rtl } = useTranslation();
  const isAr = rtl;

  const whatsappDigits = socialSettings.whatsapp?.replace(/[^\d]/g, '') ?? '';
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;
  const phoneDigits = socialSettings.phone?.replace(/[^\d+]/g, '') ?? '';
  const phoneUrl = phoneDigits ? `tel:${phoneDigits}` : null;
  const email = socialSettings.email?.trim() || '';

  const defaultMessage = useMemo(
    () =>
      encodeURIComponent(
        tx(isAr, 'مرحباً، أحتاج مساعدة بخصوص عقار على CIAR RE', 'Hello, I need help with a property on CIAR RE'),
      ),
    [isAr],
  );

  const openWhatsApp = () => {
    if (!whatsappUrl) {
      setOpen(false);
      setCurrentPage('contact');
      return;
    }
    window.open(`${whatsappUrl}?text=${defaultMessage}`, '_blank', 'noopener,noreferrer');
  };

  const goContact = () => {
    setOpen(false);
    setCurrentPage('contact');
  };

  const goSearch = () => {
    setOpen(false);
    setCurrentPage('search');
  };

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-24 end-6 z-[60] w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-white/15 bg-[#0f172a]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label={tx(isAr, 'مساعد CIAR', 'CIAR assistant')}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-emerald-600/30 to-teal-500/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">{tx(isAr, 'كيف نساعدك؟', 'How can we help?')}</p>
              <p className="text-[11px] text-white/60">{tx(isAr, 'رد سريع عبر واتساب أو التواصل', 'Quick reply via WhatsApp or contact')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={tx(isAr, 'إغلاق', 'Close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-3">
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex w-full items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-start text-white transition-colors hover:bg-emerald-500"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">
                  {whatsappUrl ? tx(isAr, 'تواصل عبر واتساب', 'Chat on WhatsApp') : tx(isAr, 'صفحة التواصل', 'Contact page')}
                </span>
                <span className="block text-[11px] text-white/80">
                  {whatsappUrl
                    ? tx(isAr, 'افتح محادثة مباشرة الآن', 'Open a direct chat now')
                    : tx(isAr, 'لم يُضبط واتساب — استخدم نموذج التواصل', 'WhatsApp not set — use contact form')}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={goContact}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-start text-white transition-colors hover:bg-white/10"
            >
              <Send className="h-5 w-5 shrink-0 text-teal-300" />
              <span>
                <span className="block text-sm font-semibold">{tx(isAr, 'أرسل استفساراً', 'Send an inquiry')}</span>
                <span className="block text-[11px] text-white/60">{tx(isAr, 'نموذج تواصل سريع', 'Quick contact form')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={goSearch}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-start text-white transition-colors hover:bg-white/10"
            >
              <Search className="h-5 w-5 shrink-0 text-amber-300" />
              <span>
                <span className="block text-sm font-semibold">{tx(isAr, 'ابحث عن عقار', 'Search properties')}</span>
                <span className="block text-[11px] text-white/60">{tx(isAr, 'تصفّح القوائم المتاحة', 'Browse available listings')}</span>
              </span>
            </button>

            {(phoneUrl || email) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {phoneUrl ? (
                  <a
                    href={phoneUrl}
                    className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {tx(isAr, 'اتصال', 'Call')}
                  </a>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/10"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {tx(isAr, 'بريد', 'Email')}
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 end-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
        aria-label={open ? tx(isAr, 'إغلاق المساعد', 'Close assistant') : tx(isAr, 'فتح المساعد', 'Open assistant')}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
