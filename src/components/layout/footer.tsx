'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  ArrowUp,
  Shield,
  Award,
  Home,
  Users,
  CheckCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n/use-translation';

/* ------------------------------------------------------------------ */
/*  Quick-link item with slide-in arrow                               */
/* ------------------------------------------------------------------ */
function QuickLinkItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="group flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowRight className="h-3 w-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          {label}
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Location item with country flag                                    */
/* ------------------------------------------------------------------ */
function LocationItem({
  flag,
  city,
  onClick,
}: {
  flag: string;
  city: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="group flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <span className="text-base leading-none">{flag}</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          {city}
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust badge                                                       */
/* ------------------------------------------------------------------ */
function TrustBadge({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-4 py-5 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */
export function Footer() {
  const { setCurrentPage } = useAppStore();
  const { t } = useTranslation();

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Back-to-top visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = useCallback(() => {
    setShowBackToTop(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    toast.success('Successfully subscribed!', {
      description: `We'll send updates to ${email}`,
    });
    setEmail('');
  };

  // ---- Data ----
  const quickLinks = [
    {
      label: t.footer.buyProperty,
      action: () => {
        useAppStore.getState().setFilters({ listingType: 'SALE' });
        setCurrentPage('search');
      },
    },
    {
      label: t.footer.rentProperty,
      action: () => {
        useAppStore.getState().setFilters({ listingType: 'RENT' });
        setCurrentPage('search');
      },
    },
    {
      label: t.footer.findAgents,
      action: () => setCurrentPage('agents'),
    },
    {
      label: t.nav.favorites,
      action: () => setCurrentPage('favorites'),
    },
  ];

  const topLocations = [
    { flag: '\u{1F1FA}\u{1F1F8}', city: 'New York' },
    { flag: '\u{1F1EC}\u{1F1E7}', city: 'London' },
    { flag: '\u{1F1F8}\u{1F1E6}', city: 'Riyadh' },
    { flag: '\u{1F1EB}\u{1F1F7}', city: 'Paris' },
    { flag: '\u{1F1EF}\u{1F1F5}', city: 'Tokyo' },
  ];

  const trustBadges = [
    { icon: Globe, label: '60+ Countries' },
    { icon: Home, label: '10K+ Properties' },
    { icon: CheckCircle, label: 'Verified Agents' },
    { icon: Shield, label: 'Secure Payments' },
  ];

  const socialLinks = [
    { icon: Globe, label: 'Website' },
    { icon: Mail, label: 'Email' },
    { icon: Phone, label: 'Phone' },
    { icon: MapPin, label: 'Location' },
  ];

  return (
    <footer className="mt-auto relative">
      {/* Gradient top border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

      {/* Main footer content */}
      <div className="bg-[#0a0f0d] text-gray-300">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
          {/* ======== Top grid: Brand | Links | Locations | Newsletter ======== */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
            {/* ---- Brand section (spans 4 cols) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              {/* Logo */}
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                <Building2 className="h-7 w-7" />
                <span className="text-xl font-bold tracking-tight">
                  Property
                  <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                    Finder
                  </span>
                </span>
              </button>

              {/* Description */}
              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                Your trusted global real estate directory. Discover premium
                properties across 60+ countries with advanced search, verified
                agents, and secure transactions.
              </p>

              {/* Social / Contact icons */}
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((s) => (
                  <button
                    key={s.label}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700/60 text-gray-400 transition-all duration-300 hover:border-emerald-500/60 hover:text-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10"
                  >
                    <s.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ---- Quick Links (spans 2 cols) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                {t.footer.quickLinks}
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <QuickLinkItem
                    key={link.label}
                    label={link.label}
                    onClick={link.action}
                  />
                ))}
              </ul>
            </motion.div>

            {/* ---- Top Locations (spans 2 cols) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                {t.footer.topLocations}
              </h3>
              <ul className="space-y-3">
                {topLocations.map((loc) => (
                  <LocationItem
                    key={loc.city}
                    flag={loc.flag}
                    city={loc.city}
                    onClick={() => setCurrentPage('search')}
                  />
                ))}
              </ul>
            </motion.div>

            {/* ---- Newsletter (spans 4 cols) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-4"
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Newsletter
              </h3>
              <p className="mb-5 text-sm text-gray-400">
                Stay updated with the latest luxury properties and exclusive
                offers.
              </p>

              {!subscribed ? (
                <form
                  onSubmit={handleSubscribe}
                  className="relative flex items-stretch gap-0 overflow-hidden rounded-xl border border-gray-700/60 bg-gray-900/60 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all duration-300"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-medium text-white transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    <Send className="h-4 w-4" />
                    Subscribe
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-emerald-300">
                    Thanks for subscribing!
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ======== Trust Badges ======== */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {trustBadges.map((badge, i) => (
              <TrustBadge
                key={badge.label}
                icon={badge.icon}
                label={badge.label}
                delay={i * 0.1}
              />
            ))}
          </div>

          {/* ======== Divider ======== */}
          <div className="mt-12 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />

          {/* ======== Bottom bar ======== */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} PropertyFinder.{' '}
              {t.footer.rights}.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                {t.footer.privacy}
              </button>
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                {t.footer.terms}
              </button>
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                {t.common.contact}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======== Back to top button ======== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg shadow-emerald-500/25 transition-shadow duration-300 hover:shadow-xl hover:shadow-emerald-500/40"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
