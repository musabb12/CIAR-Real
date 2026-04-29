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
  Sparkles,
  Diamond,
  Crown,
  TrendingUp,
  Lock,
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
        className="group flex w-full items-center gap-2 text-sm text-gray-400 transition-colors duration-300 hover:text-amber-300"
      >
        <ArrowRight className="h-3 w-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-amber-400" />
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          {label}
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Location item with MapPin icon (no flags)                         */
/* ------------------------------------------------------------------ */
function LocationItem({
  city,
  country,
  onClick,
}: {
  city: string;
  country: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="group flex w-full items-start gap-2.5 text-sm text-gray-400 transition-colors duration-300 hover:text-amber-300"
      >
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/70 transition-colors duration-300 group-hover:text-amber-400" />
        <span className="flex flex-col leading-snug transition-transform duration-300 group-hover:translate-x-1">
          <span className="text-gray-300 group-hover:text-amber-200 transition-colors duration-300">{city}</span>
          <span className="text-[11px] text-gray-500 group-hover:text-amber-400/60 transition-colors duration-300">{country}</span>
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
  sublabel,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-stat rounded-xl flex flex-col items-center gap-2.5 px-4 py-5"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-amber-700/10 ring-1 ring-amber-500/10">
        <Icon className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-semibold tracking-wide text-gray-200">{label}</span>
        {sublabel && (
          <span className="text-[10px] tracking-wider text-amber-500/60 uppercase">{sublabel}</span>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decorative gold line                                              */
/* ------------------------------------------------------------------ */
function GoldDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      <Diamond className="h-3 w-3 text-amber-500/40" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
    </div>
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
    { city: 'New York', country: 'United States' },
    { city: 'London', country: 'United Kingdom' },
    { city: 'Riyadh', country: 'Saudi Arabia' },
    { city: 'Paris', country: 'France' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'Dubai', country: 'UAE' },
  ];

  const trustBadges = [
    { icon: Globe, label: '60+ Countries', sublabel: 'Global Reach' },
    { icon: Home, label: '10K+ Properties', sublabel: 'Premium Listings' },
    { icon: Users, label: 'Verified Agents', sublabel: 'Trusted Network' },
    { icon: Lock, label: 'Secure Payments', sublabel: 'Protected' },
  ];

  const socialLinks = [
    { icon: Globe, label: 'Website' },
    { icon: Mail, label: 'Email' },
    { icon: Phone, label: 'Phone' },
    { icon: MapPin, label: 'Location' },
  ];

  return (
    <footer className="mt-auto relative">
      {/* Gold gradient top border */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-700/0 via-amber-500 to-amber-700/0" />

      {/* Main footer with background image and overlay */}
      <div
        className="relative text-gray-300"
        style={{
          backgroundImage: 'url(https://picsum.photos/seed/ciar-footer/1920/600.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c0a]/95 via-[#0a0f0d]/97 to-[#060908]/99" />

        {/* Subtle gold ambient glow at top */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
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
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/10 ring-1 ring-amber-500/20">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <span className="font-heading bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent text-2xl font-bold tracking-wide">
                  CIAR
                </span>
              </button>

              {/* Tagline */}
              <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.25em] text-amber-500/50">
                Luxury Real Estate
              </p>

              {/* Description */}
              <p className="mt-5 text-sm leading-relaxed text-gray-400">
                CIAR is your trusted global real estate directory. Discover
                premium properties across 60+ countries with AI-powered tools,
                smart analytics, verified agents, and secure transactions.
              </p>

              {/* Decorative accent */}
              <div className="mt-6 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />

              {/* Social / Contact icons */}
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((s) => (
                  <motion.button
                    key={s.label}
                    aria-label={s.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-badge flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-all duration-300 hover:text-amber-400 hover:shadow-lg hover:shadow-amber-500/10"
                  >
                    <s.icon className="h-4 w-4" />
                  </motion.button>
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
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500/70" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  {t.footer.quickLinks}
                </h3>
              </div>
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
              <div className="mb-5 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500/70" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  {t.footer.topLocations}
                </h3>
              </div>
              <ul className="space-y-3.5">
                {topLocations.map((loc) => (
                  <LocationItem
                    key={loc.city}
                    city={loc.city}
                    country={loc.country}
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
              <div className="mb-2 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-amber-500/70" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Newsletter
                </h3>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-gray-400">
                Stay updated with the latest luxury properties and exclusive
                offers curated just for you.
              </p>

              {!subscribed ? (
                <form
                  onSubmit={handleSubscribe}
                  className="glass-input rounded-xl relative flex items-stretch gap-0 overflow-hidden"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent px-4 py-3.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-amber-600 to-amber-500 px-5 text-sm font-medium text-gray-950 transition-shadow duration-300 hover:shadow-lg hover:shadow-amber-500/25"
                  >
                    <Send className="h-4 w-4" />
                    Subscribe
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-badge rounded-xl flex items-center gap-3 px-5 py-3.5"
                >
                  <CheckCircle className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-amber-200">
                    Thanks for subscribing!
                  </span>
                </motion.div>
              )}

              {/* Trusted line */}
              <div className="mt-4 flex items-center gap-2 text-gray-500">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-[11px] tracking-wide">No spam, unsubscribe anytime</span>
              </div>
            </motion.div>
          </div>

          {/* ======== Decorative Divider ======== */}
          <div className="mt-14">
            <GoldDivider />
          </div>

          {/* ======== Trust Badges ======== */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {trustBadges.map((badge, i) => (
              <TrustBadge
                key={badge.label}
                icon={badge.icon}
                label={badge.label}
                sublabel={badge.sublabel}
                delay={i * 0.1}
              />
            ))}
          </div>

          {/* ======== Bottom Divider ======== */}
          <div className="mt-12">
            <GoldDivider />
          </div>

          {/* ======== Bottom bar ======== */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-3.5 w-3.5 text-amber-500/40" />
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()}{' '}
                <button
                  onClick={() => setCurrentPage('admin-login')}
                  className="font-heading text-amber-400/60 font-semibold cursor-default select-none"
                  title=""
                >
                  CIAR
                </button>.{' '}
                {t.footer.rights}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 transition-colors duration-300 hover:text-amber-300"
              >
                {t.footer.privacy}
              </button>
              <span className="h-3 w-px bg-amber-500/20" />
              <button
                onClick={() => setCurrentPage('home')}
                className="text-xs text-gray-500 transition-colors duration-300 hover:text-amber-300"
              >
                {t.footer.terms}
              </button>
              <span className="h-3 w-px bg-amber-500/20" />
              <button
                onClick={() => setCurrentPage('contact')}
                className="text-xs text-gray-500 transition-colors duration-300 hover:text-amber-300"
              >
                {t.common.contact}
              </button>
            </div>
          </motion.div>
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
            className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-gray-950 shadow-lg shadow-amber-500/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-amber-500/30"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
