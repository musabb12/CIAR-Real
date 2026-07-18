'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Phone,
  Mail,
  Search,
  Sparkles,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';

const tx = (isAr: boolean, ar: string, en: string) => (isAr ? ar : en);

type ChatMsg = { role: 'user' | 'assistant'; content: string };

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { socialSettings, setCurrentPage, isFeatureEnabled } = useAppStore();
  const { rtl, locale } = useTranslation();
  const isAr = rtl;

  const aiEnabled = isFeatureEnabled('ai_chatbot');

  const whatsappDigits = socialSettings.whatsapp?.replace(/[^\d]/g, '') ?? '';
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;
  const phoneDigits = socialSettings.phone?.replace(/[^\d+]/g, '') ?? '';
  const phoneUrl = phoneDigits ? `tel:${phoneDigits}` : null;
  const email = socialSettings.email?.trim() || '';

  const welcome = useMemo(
    () =>
      tx(
        isAr,
        'مرحباً! أنا مساعد CIAR الذكي. اسألني عن العقارات، الإعلانات، الاشتراكات، أو اطلب توجيهك للتواصل البشري.',
        'Hi! I am the CIAR AI assistant. Ask about properties, ads, subscriptions, or ask me to connect you with a human.',
      ),
    [isAr],
  );

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [open, messages.length, welcome]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (!aiEnabled) return null;

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    const nextHistory = [...messages, { role: 'user' as const, content: message }];
    setMessages(nextHistory);
    setSending(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          locale,
          history: nextHistory.slice(0, -1),
        }),
      });
      const data = await res.json();
      const reply =
        typeof data.reply === 'string'
          ? data.reply
          : tx(isAr, 'عذراً، حدث خطأ. جرّب مرة أخرى.', 'Sorry, something went wrong. Try again.');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: tx(isAr, 'تعذّر الاتصال بالمساعد. استخدم واتساب أدناه.', 'Could not reach the assistant. Use WhatsApp below.'),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickPrompts = isAr
    ? ['كيف أبحث عن عقار؟', 'كيف أنشر إعلاناً؟', 'ما هي الاشتراكات؟']
    : ['How do I search properties?', 'How do I publish an ad?', 'What are subscriptions?'];

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-24 end-6 z-[60] flex h-[min(70vh,32rem)] w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0f172a]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label={tx(isAr, 'مساعد CIAR الذكي', 'CIAR AI assistant')}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-emerald-600/30 to-teal-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30">
                <Sparkles className="h-4 w-4 text-emerald-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{tx(isAr, 'مساعد CIAR', 'CIAR Assistant')}</p>
                <p className="text-[11px] text-white/60">{tx(isAr, 'ذكاء اصطناعي + دعم بشري', 'AI + human support')}</p>
              </div>
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

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user' ? 'bg-amber-500/30' : 'bg-emerald-500/30'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User className="h-3.5 w-3.5 text-amber-200" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-emerald-200" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-500/20 text-amber-50'
                      : 'bg-white/8 text-white/90'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-white/50 px-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {tx(isAr, 'يكتب...', 'Typing...')}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 hover:bg-white/10"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            className="border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tx(isAr, 'اكتب رسالتك...', 'Type your message...')}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/40"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-40"
                aria-label={tx(isAr, 'إرسال', 'Send')}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2">
            {whatsappUrl && (
              <a
                href={`${whatsappUrl}?text=${encodeURIComponent(tx(isAr, 'مرحباً، أحتاج مساعدة بخصوص CIAR', 'Hello, I need help with CIAR'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-emerald-300 hover:bg-white/5"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCurrentPage('search');
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-amber-300 hover:bg-white/5"
            >
              <Search className="h-3 w-3" /> {tx(isAr, 'بحث', 'Search')}
            </button>
            {phoneUrl && (
              <a href={phoneUrl} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/70 hover:bg-white/5">
                <Phone className="h-3 w-3" /> {tx(isAr, 'اتصال', 'Call')}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/70 hover:bg-white/5">
                <Mail className="h-3 w-3" /> {tx(isAr, 'بريد', 'Email')}
              </a>
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
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </>
  );
}
