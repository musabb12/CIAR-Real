'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  UserPlus,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { toast } from 'sonner';
import type { AccountType } from '@/types';
import { resolvePageAfterLogin } from '@/lib/auth-roles';
import { mapAuthApiError } from '@/lib/auth-errors';

export function RegisterPage() {
  const { t, rtl } = useTranslation();
  const {
    setCurrentPage,
    login,
    contentSettings,
    registerAccountTypePreset,
    setRegisterAccountTypePreset,
  } = useAppStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agree: false,
    accountType: 'CLIENT' as AccountType,
    companyName: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAr = rtl;
  const registerContent = contentSettings.register;

  const tx = (ar: string, en: string) => (isAr ? ar : en);

  useEffect(() => {
    if (!registerAccountTypePreset) return;
    setForm((prev) => ({ ...prev, accountType: registerAccountTypePreset }));
    setRegisterAccountTypePreset(null);
  }, [registerAccountTypePreset, setRegisterAccountTypePreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(tx('الرجاء إدخال الاسم', 'Please enter your name'));
      return;
    }
    if (!form.email.includes('@')) {
      setError(tx('بريد إلكتروني غير صحيح', 'Invalid email'));
      return;
    }
    if (form.password.length < 6) {
      setError(tx('كلمة المرور قصيرة (6 أحرف على الأقل)', 'Password must be at least 6 chars'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(tx('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
      return;
    }
    if (!form.agree) {
      setError(tx('يجب الموافقة على الشروط', 'You must accept the terms'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          accountType: form.accountType,
          companyName: form.accountType === 'COMPANY' ? form.companyName.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success(tx('تم إنشاء الحساب بنجاح', 'Account created'));
        setTimeout(() => {
          login(data.user);
          setCurrentPage(resolvePageAfterLogin(data.user.role));
        }, 900);
      } else {
        setError(
          mapAuthApiError(
            data.error,
            tx,
            'فشل التسجيل',
            'Registration failed',
          ),
        );
      }
    } catch {
      setError(tx('خطأ في الشبكة، حاول مرة أخرى', 'Network error, try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-bg min-h-dvh py-8 px-1 sm:py-10 sm:px-2 lg:px-0 relative overflow-x-hidden">
      {/* Decorative blurred orbs */}
      <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-[1] w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* ── Left: Marketing panel (visible on all breakpoints; stacks above form on small screens) ── */}
        <div className="text-white space-y-6 sm:space-y-8 px-0 sm:px-2 max-lg:pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/30">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading text-3xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              CIAR
            </span>
          </div>

          <div>
            <h2 className="font-heading text-4xl xl:text-5xl font-bold leading-tight">
              {tx('انضم إلى عائلة CIAR', 'Join the CIAR family')}
            </h2>
            <p className="mt-4 text-white/70 text-lg leading-relaxed">
              {tx(
                'احصل على وصول حصري لأفخر العقارات حول العالم، وتجربة بحث ذكية مدعومة بالذكاء الاصطناعي.',
                'Get exclusive access to the world\'s finest properties and an AI-powered search experience.',
              )}
            </p>
          </div>

          <ul className="space-y-4">
            {[
              {
                icon: Sparkles,
                ar: 'تجربة فاخرة وأنيقة',
                en: 'Luxury, refined experience',
              },
              {
                icon: CheckCircle2,
                ar: 'قوائم موثقة من وكلاء معتمدين',
                en: 'Verified listings from trusted agents',
              },
              {
                icon: Shield,
                ar: 'حماية كاملة لبياناتك',
                en: 'Full protection for your data',
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 border border-white/10">
                  <item.icon className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-white/85">{tx(item.ar, item.en)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: Form card ── */}
        <div className="auth-card rounded-2xl p-6 sm:p-8 lg:p-10">
          <button
            onClick={() => setCurrentPage('home')}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] mb-4 transition-colors"
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
            {tx('العودة للرئيسية', 'Back to home')}
          </button>

          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 shadow-lg shadow-amber-500/25">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {registerContent.title?.trim() || tx('إنشاء حساب جديد', 'Create your account')}
            </h1>
            <p className="text-white/60 text-sm mt-2">
              {registerContent.subtitle?.trim() || tx(
                'انضم إلينا واكتشف عالم العقارات الفاخرة',
                'Join us and discover luxury real estate worldwide',
              )}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {tx('تم إنشاء حسابك! جارٍ التحويل...', 'Account created! Redirecting...')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                {tx('نوع الحساب', 'Account type')}
              </label>
              <select
                className="auth-input h-11 w-full rounded-xl px-3 text-sm"
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value as AccountType })}
              >
                <option value="CLIENT">{tx('عميل (شراء / إيجار)', 'Client (buy / rent)')}</option>
                <option value="OWNER">{tx('صاحب عقار', 'Property owner')}</option>
                <option value="COMPANY">{tx('شركة عقارات', 'Real estate company')}</option>
              </select>
            </div>
            {form.accountType === 'COMPANY' && (
              <div>
                <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                  {tx('اسم الشركة', 'Company name')}
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="auth-input h-11 w-full rounded-xl px-4 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                {tx('الاسم الكامل', 'Full name')}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={tx('محمد أحمد', 'John Doe')}
                  className="auth-input h-11 w-full rounded-xl ps-10 pe-4 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                  {tx('البريد الإلكتروني', 'Email')}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="auth-input h-11 w-full rounded-xl ps-10 pe-4 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                  {tx('رقم الهاتف', 'Phone')}{' '}
                  <span className="text-white/40 text-[11px]">
                    ({tx('اختياري', 'optional')})
                  </span>
                </label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+966 5XX XXX XXX"
                    className="auth-input h-11 w-full rounded-xl ps-10 pe-4 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                {tx('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="auth-input h-11 w-full rounded-xl ps-10 pe-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                {tx('تأكيد كلمة المرور', 'Confirm password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="auth-input h-11 w-full rounded-xl ps-10 pe-4 text-sm"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-[13px] text-white/70 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-amber-500"
              />
              <span>
                {tx(
                  'أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بـ CIAR.',
                  'I accept CIAR\'s Terms of Service and Privacy Policy.',
                )}
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-amber-500/30 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="me-2 h-4 w-4" />
                  {tx('إنشاء الحساب', 'Create account')}
                </>
              )}
            </Button>

            <p className="text-center text-[13px] text-white/60 pt-2">
              {tx('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="font-semibold text-amber-300 hover:text-amber-200 transition-colors"
              >
                {tx('تسجيل الدخول', 'Sign in')}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
