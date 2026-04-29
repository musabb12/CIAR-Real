'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ChevronDown,
  Globe,
  Building2,
  Headphones,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/use-translation';

export function ContactPage() {
  const { t, rtl } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const cp = t.contactPage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = formRef.current;
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(cp.success, { description: cp.successDesc });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(cp.error, { description: result.error || cp.errorDesc });
      }
    } catch {
      toast.error(cp.error, { description: cp.errorDesc });
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    { q: cp.faq1q, a: cp.faq1a },
    { q: cp.faq2q, a: cp.faq2a },
    { q: cp.faq3q, a: cp.faq3a },
    { q: cp.faq4q, a: cp.faq4a },
  ];

  const contactInfo = [
    { icon: MapPin, label: cp.address, value: cp.addressText },
    { icon: Mail, label: cp.emailLabel, value: cp.emailText },
    { icon: Phone, label: cp.phoneLabel, value: cp.phoneText },
    { icon: Clock, label: cp.workHours, value: cp.workHoursText },
  ];

  return (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
        <div className="absolute top-0 start-0 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-500/5" />
        <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/5" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/25">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              {cp.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              {cp.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form + Office Info */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Form (3 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="glass-deep rounded-2xl p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-700/10 ring-1 ring-amber-500/10">
                    <Send className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cp.getInTouch}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cp.getInTouchDesc}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.name}</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={cp.namePlaceholder}
                        className="glass-input h-11 w-full rounded-xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.email}</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder={cp.emailPlaceholder}
                        className="glass-input h-11 w-full rounded-xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.phone}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder={cp.phonePlaceholder}
                        className="glass-input h-11 w-full rounded-xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.subject}</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder={cp.subjectPlaceholder}
                        className="glass-input h-11 w-full rounded-xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.message}</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={cp.messagePlaceholder}
                      className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={sending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {sending ? cp.sending : cp.send}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Office Info Sidebar (2 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Office Info Card */}
              <div className="glass-deep rounded-2xl p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-700/10 ring-1 ring-amber-500/10">
                    <Building2 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cp.officeInfo}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cp.officeInfoDesc}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {contactInfo.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: rtl ? 20 : -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 ring-1 ring-amber-500/10">
                        <item.icon className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Social / Quick Connect */}
              <div className="glass-deep rounded-2xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cp.socialMedia}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {['Twitter', 'LinkedIn', 'Instagram', 'Facebook'].map((social) => (
                    <motion.button
                      key={social}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gradient-to-br hover:from-amber-500/10 hover:to-emerald-500/10 hover:text-amber-600 dark:bg-white/5 dark:hover:text-amber-400"
                      aria-label={social}
                    >
                      <Globe className="h-4 w-4" />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Support Card */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 p-6 ring-1 ring-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/20">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">24/7 Support</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">We are always here to help</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">{cp.faq}</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">{cp.faqSubtitle}</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-deep rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 px-5 py-4 dark:border-white/5">
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
