'use client';

import { useState } from 'react';
import {
  Building2,
  Mail,
  Lock,
  LogIn,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getPrimaryPageBackground } from '@/lib/page-backgrounds';
import { toast } from 'sonner';

export function LoginPage() {
  const { rtl } = useTranslation();
  const { setCurrentPage, login, contentSettings } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAr = rtl;
  const tx = (ar: string, en: string) => (isAr ? ar : en);
  const loginContent = contentSettings.login;
  const loginBackground = getPrimaryPageBackground(
    loginContent,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=85&auto=format&fit=crop'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError(tx('بريد إلكتروني غير صحيح', 'Invalid email'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        toast.success(tx('تم تسجيل الدخول بنجاح', 'Signed in successfully'));
        setCurrentPage(data.user.role === 'ADMIN' ? 'admin' : 'home');
      } else {
        setError(data.error || tx('فشل تسجيل الدخول', 'Login failed'));
      }
    } catch {
      setError(tx('خطأ في الشبكة، حاول مرة أخرى', 'Network error, try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page-image-bg min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center"
      style={{
        ['--auth-image' as string]:
          `url('${loginBackground}')`,
      }}
    >
      <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto">
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
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              {loginContent.title?.trim() || tx('مرحباً بعودتك', 'Welcome back')}
            </h1>
            <p className="text-white/60 text-sm mt-2">
              {loginContent.subtitle?.trim() || tx('سجّل الدخول للوصول إلى حسابك', 'Sign in to access your account')}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="you@example.com"
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
                  {tx('تسجيل الدخول', 'Sign in')}
                </>
              )}
            </Button>

            <p className="text-center text-[13px] text-white/60 pt-2">
              {tx('ليس لديك حساب؟', "Don't have an account?")}{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="font-semibold text-amber-300 hover:text-amber-200 transition-colors"
              >
                {tx('إنشاء حساب', 'Sign up')}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
