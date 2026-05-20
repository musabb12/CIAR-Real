'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  LogIn,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getPrimaryPageBackground } from '@/lib/page-backgrounds';
import type { User as AppUser } from '@/types';
import { toast } from 'sonner';
import { mapAuthApiError } from '@/lib/auth-errors';

export function AdminLoginPage() {
  const router = useRouter();
  const { rtl } = useTranslation();
  const { setCurrentPage, login, contentSettings } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const adminLoginContent = contentSettings['admin-login'];
  const adminBackground = getPrimaryPageBackground(
    adminLoginContent,
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=2400&q=85&auto=format&fit=crop'
  );
  const isStandaloneAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  const goHome = () => {
    if (isStandaloneAdminRoute) {
      router.push('/');
      return;
    }
    setCurrentPage('home');
  };

  const goUserLogin = () => {
    if (isStandaloneAdminRoute) {
      router.push('/');
      return;
    }
    setCurrentPage('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError(tx('أدخل بريدًا إلكترونيًا صحيحًا', 'Enter a valid email address'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          mapAuthApiError(
            data.error,
            tx,
            'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.',
            'Sign-in failed. Check your email and password.',
          ),
        );
        return;
      }

      if (data.user?.role !== 'ADMIN') {
        await fetch('/api/logout', { method: 'POST' }).catch(() => {});
        setError(
          tx(
            'هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.',
            'This account does not have access to the admin dashboard.',
          ),
        );
        return;
      }

      login(data.user as AppUser);
      toast.success(tx('تم تسجيل الدخول كأدمن', 'Signed in as Admin'));
      setCurrentPage('admin');
      router.replace('/admin/dashboard');
    } catch {
      setError(
        tx(
          'حدث خطأ في الشبكة. حاول مرة أخرى.',
          'A network error occurred. Please try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page-image-bg min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center"
      style={{
        ['--auth-image' as string]:
          `url('${adminBackground}')`,
      }}
    >
      {/* Decorative orbs */}
      <div className="absolute top-20 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-[28rem] h-[28rem] rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto">
        <div className="auth-card rounded-2xl p-7 sm:p-9 lg:p-10">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] mb-5 transition-colors"
          >
            <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? 'rotate-180' : ''}`} />
            {tx('العودة للرئيسية', 'Back to home')}
          </button>

          {/* Crest */}
          <div className="text-center mb-7">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-emerald-500 shadow-2xl shadow-amber-500/40" />
              <div className="absolute inset-[2px] rounded-2xl bg-[#0a1014] flex items-center justify-center">
                <Shield className="h-8 w-8 text-amber-400" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-amber-400/80 font-bold mb-2">
              <span className="h-px w-6 bg-amber-400/50" />
              <span>{tx('بوابة الأدمن', 'Admin Portal')}</span>
              <span className="h-px w-6 bg-amber-400/50" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {adminLoginContent.title?.trim() || tx('دخول مدير النظام', 'Administrator Sign-in')}
            </h1>
            <p className="text-white/55 text-sm mt-2 leading-relaxed">
              {adminLoginContent.subtitle?.trim() || tx(
                'هذه منطقة آمنة. الدخول مخصص للمدراء المعتمدين فقط.',
                'Restricted area. Authorized administrators only.',
              )}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-[13px] font-semibold text-white/80 mb-1.5">
                {tx('البريد الإلكتروني', 'Email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@realtyhub.com"
                  autoComplete="email"
                  className="auth-input h-11 w-full rounded-xl ps-10 pe-4 text-sm"
                />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-amber-500/30 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="me-2 h-4 w-4" />
                  {tx('دخول لوحة التحكم', 'Enter Dashboard')}
                </>
              )}
            </Button>

            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={goUserLogin}
                className="w-full inline-flex items-center justify-center gap-1.5 text-white/50 hover:text-white text-[12px] transition-colors"
              >
                <Building2 className="h-3 w-3" />
                {tx('دخول كمستخدم عادي', 'Sign in as a regular user')}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/30 mt-4">
          © {new Date().getFullYear()} CIAR — {tx('جميع الحقوق محفوظة', 'All rights reserved')}
        </p>
      </div>
    </div>
  );
}
