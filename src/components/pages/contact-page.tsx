'use client';

import { useState, useRef } from 'react';
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useAppStore } from '@/store/app-store';

export function ContactPage() {
  const { t, rtl } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const cp = t.contactPage;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRef.current),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  };

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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900" />
        <div className="absolute top-0 start-0 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-500/5" />
        <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/5" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/25">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            {cp.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            {cp.subtitle}
          </p>
        </div>
      </section>

      {/* Contact Form + Info Cards */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Form — 3 columns */}
            <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Card className="glass-deep border-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-700/10 ring-1 ring-amber-500/10">
                      <Send className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {cp.getInTouch}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cp.getInTouchDesc}
                      </p>
                    </div>
                  </div>

                  {/* Success Banner */}
                  {success && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {cp.success}
                        </p>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                          {cp.successDesc}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + Email */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name" className="text-gray-700 dark:text-gray-300">
                          {cp.name}
                        </Label>
                        <Input
                          id="contact-name"
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder={cp.namePlaceholder}
                          className="glass-input h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email" className="text-gray-700 dark:text-gray-300">
                          {cp.email}
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder={cp.emailPlaceholder}
                          className="glass-input h-11"
                        />
                      </div>
                    </div>

                    {/* Phone + Subject */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone" className="text-gray-700 dark:text-gray-300">
                          {cp.phone}
                        </Label>
                        <Input
                          id="contact-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder={cp.phonePlaceholder}
                          className="glass-input h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-subject" className="text-gray-700 dark:text-gray-300">
                          {cp.subject}
                        </Label>
                        <Input
                          id="contact-subject"
                          type="text"
                          value={form.subject}
                          onChange={(e) => updateField('subject', e.target.value)}
                          placeholder={cp.subjectPlaceholder}
                          className="glass-input h-11"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="contact-message" className="text-gray-700 dark:text-gray-300">
                        {cp.message}
                      </Label>
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder={cp.messagePlaceholder}
                        className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none focus:ring-2 focus:ring-amber-500/20 dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-gradient-to-r from-amber-500 to-emerald-600 text-white hover:from-amber-600 hover:to-emerald-700"
                    >
                      {sending ? (
                        <>
                          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          {cp.sending}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {cp.send}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar — 2 columns */}
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {/* Contact Info Card */}
              <Card className="glass-card border-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-700/10 ring-1 ring-amber-500/10">
                      <Globe className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {cp.officeInfo}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cp.officeInfoDesc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {contactInfo.map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 ring-1 ring-amber-500/10">
                          <item.icon className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 break-words">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Card */}
              <Card className="glass-card border-0">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {cp.socialMedia}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {['Twitter', 'LinkedIn', 'Instagram', 'Facebook'].map((social) => (
                      <Button
                        key={social}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        aria-label={social}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support Card */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 p-6 ring-1 ring-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/20">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">24/7 Support</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      We are always here to help
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
