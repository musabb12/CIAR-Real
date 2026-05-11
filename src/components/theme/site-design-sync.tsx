'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/app-store';

export function SiteDesignSync() {
  const designSettings = useAppStore((s) => s.designSettings);
  const contentSettings = useAppStore((s) => s.contentSettings);
  const socialSettings = useAppStore((s) => s.socialSettings);
  const hydrateSiteSettings = useAppStore((s) => s.hydrateSiteSettings);
  const hydratedRef = useRef(false);
  const previousSerializedRef = useRef('');
  const payload = useMemo(
    () => ({ designSettings, contentSettings, socialSettings }),
    [designSettings, contentSettings, socialSettings],
  );
  const serializedPayload = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/site-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        hydrateSiteSettings({
          designSettings: data.designSettings,
          contentSettings: data.contentSettings,
          socialSettings: data.socialSettings,
        });
        previousSerializedRef.current = JSON.stringify({
          designSettings: data.designSettings ?? designSettings,
          contentSettings: data.contentSettings ?? contentSettings,
          socialSettings: data.socialSettings ?? socialSettings,
        });
        hydratedRef.current = true;
      })
      .catch(() => {
        hydratedRef.current = true;
      });
    return () => {
      mounted = false;
    };
  }, [hydrateSiteSettings]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--gradient-emerald-start', designSettings.primaryColor);
    root.style.setProperty('--primary', designSettings.primaryColor);
    root.style.setProperty('--gradient-gold-start', designSettings.accentColor);
    root.style.setProperty('--accent', designSettings.accentColor);
    root.style.setProperty('--site-hero-image', `url('${designSettings.heroImageUrl}')`);
  }, [designSettings]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (serializedPayload === previousSerializedRef.current) return;

    const timer = setTimeout(() => {
      fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: serializedPayload,
      })
        .then((res) => {
          if (!res.ok) return;
          previousSerializedRef.current = serializedPayload;
        })
        .catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [serializedPayload]);

  return null;
}
