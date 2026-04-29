'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function AdminLoginPage() {
  const { setCurrentPage, login } = useAppStore();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        login(data.user);
        toast.success('Welcome back, Administrator');
        setCurrentPage('admin');
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://picsum.photos/seed/ciar-admin-login/1920/1080.jpg)',
        }}
      >
        {/* Multi-layer dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      </div>

      {/* Subtle gold ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-amber-900/8 to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        <Card className="border-white/[0.08] bg-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <CardHeader className="flex flex-col items-center gap-4 pb-2">
            {/* Shield icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 ring-1 ring-amber-500/20"
            >
              <Shield className="h-8 w-8 text-amber-400" />
            </motion.div>

            {/* CIAR branding */}
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold tracking-wide text-white">
                CIAR
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.25em] text-amber-400/60">
                {t.admin.adminPortalSubtitle.replace('Access ', '')}
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-center text-sm text-gray-400">
              {t.auth.subtitle}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label
                  htmlFor="admin-email"
                  className="text-xs font-medium uppercase tracking-wider text-gray-400"
                >
                  {t.auth.email}
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder={t.admin.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-11 border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-amber-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label
                  htmlFor="admin-password"
                  className="text-xs font-medium uppercase tracking-wider text-gray-400"
                >
                  {t.auth.password}
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.admin.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-11 border-white/[0.08] bg-white/[0.04] pr-11 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-amber-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-200 hover:text-amber-400"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-gray-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:from-amber-400 hover:to-amber-500 hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </span>
                  ) : (
                    t.auth.signIn
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-8 pt-2">
            <button
              onClick={() => setCurrentPage('home')}
              className="group flex items-center gap-2 text-sm text-gray-500 transition-colors duration-300 hover:text-amber-300"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
              {t.admin.backToHome}
            </button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
