'use client';

import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export function Footer() {
  const { setCurrentPage } = useAppStore();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Property<span className="text-primary">Finder</span>
              </span>
            </button>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your trusted global real estate directory. Discover premium properties across 5+ countries with advanced search and filtering.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Buy Property', action: () => { useAppStore.getState().setFilters({ listingType: 'SALE' }); setCurrentPage('search'); } },
                { label: 'Rent Property', action: () => { useAppStore.getState().setFilters({ listingType: 'RENT' }); setCurrentPage('search'); } },
                { label: 'Find Agents', action: () => setCurrentPage('agents') },
                { label: 'Favorites', action: () => setCurrentPage('favorites') },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Top Locations</h3>
            <ul className="mt-3 space-y-2">
              {['Dubai, UAE', 'London, UK', 'Cairo, Egypt', 'Riyadh, Saudi Arabia', 'New York, USA'].map((loc) => (
                <li key={loc}>
                  <button
                    onClick={() => { setCurrentPage('search'); }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <MapPin className="h-3 w-3" /> {loc}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Contact Us</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" /> info@propertyfinder.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" /> +1 (800) 555-0100
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Global Coverage
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} PropertyFinder. All rights reserved.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setCurrentPage('home')} className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</button>
            <button onClick={() => setCurrentPage('home')} className="text-sm text-muted-foreground hover:text-primary">Terms of Service</button>
            <button onClick={() => setCurrentPage('home')} className="text-sm text-muted-foreground hover:text-primary">Contact</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
