'use client';

import { Shield, FileText } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getPrivacyPolicy, getTermsOfService } from '@/lib/legal-content';

type LegalKind = 'privacy' | 'terms';

const HERO_VARIANT: Record<LegalKind, 'contact' | 'default'> = {
  privacy: 'contact',
  terms: 'default',
};

export function LegalDocumentPage({ kind }: { kind: LegalKind }) {
  const { locale } = useTranslation();
  const doc = kind === 'privacy' ? getPrivacyPolicy(locale) : getTermsOfService(locale);
  const Icon = kind === 'privacy' ? Shield : FileText;

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        variant={HERO_VARIANT[kind]}
        icon={Icon}
        badgeText={doc.lastUpdated}
        title={doc.title}
        subtitle={doc.subtitle}
        paddingClass="py-16 sm:py-20"
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="space-y-10">
          {doc.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return <LegalDocumentPage kind="privacy" />;
}

export function TermsPage() {
  return <LegalDocumentPage kind="terms" />;
}
