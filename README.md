# CIAR Real Estate

> **A production-grade global property marketplace** — luxury listings, partner subscriptions, and a full admin control plane across 60+ countries. Built for scale on Next.js, Firestore, and a custom design system with first-class Arabic RTL support.

<!-- Replace with a real screenshot or demo GIF -->
<p align="center">
  <img src="docs/screenshot-placeholder.png" alt="CIAR Real Estate — Homepage" width="900" />
  <br />
  <em>↑ Add <code>docs/screenshot-placeholder.png</code> or link a hosted demo GIF here</em>
</p>

<p align="center">
  <a href="https://github.com/alphacode800-web/CIAR-Real"><img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Firestore-Admin-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firestore" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Zustand-State-764ABC?style=flat-square" alt="Zustand" /></a>
</p>

---

## Tech Stack & Key Highlights

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, custom glass/luxury CSS layers, Framer Motion |
| **UI** | Radix UI, shadcn/ui primitives, Lucide icons, Recharts |
| **State** | Zustand (persisted), TanStack Query & Table |
| **Backend** | Next.js Route Handlers, Firebase Admin SDK, Firestore |
| **Data** | Firestore (production) · Prisma + SQLite (local/legacy) |
| **Maps & Geo** | Leaflet, server-side geo-country detection |
| **Auth** | bcryptjs sessions, role-based access (User / Agent / Admin / Partner) |
| **i18n** | 5 locales (EN, AR, FR, ES, TR) with full RTL for Arabic |

### Engineering highlights

- **Custom luxury design system** — layered CSS (`globals.css`, `estate-modern.css`, `luxury-ui.css`) with glass morphism, 3D property cards, and admin-specific theming — not a stock template.
- **Resilient Firestore data layer** — in-process read cache with stale fallback when quota is exhausted; demo catalog auto-merges when Firebase is unconfigured.
- **Cross-tab admin sync** — `CustomEvent` + `localStorage` broadcast so public pages re-fetch the moment an admin mutates news, listings, or feature flags.
- **Locale-aware commerce** — 22 display currencies with server-side conversion, Western-numeral formatting policy, and geo-prefilled country filters on first visit.

---

## Core Features

- **🌍 Global property marketplace** — Search, filter, and sort listings across countries, regions, and cities. Filters persist in Zustand; visitor country is resolved once via CDN headers → server IP → client geo (`useVisitorCountry`).
- **🏠 Rich property experience** — 3D-tilt cards, image galleries, Leaflet maps, mortgage calculator, side-by-side comparison, and WhatsApp deep-links for agent contact.
- **👤 Partner & agent platform** — Dedicated partner dashboard, listing CRUD, profile management, and subscription-gated features with role-aware navigation (`auth-roles.ts`).
- **💳 Subscription checkout** — 11 payment methods with per-method field schemas (`payment-method-config.ts`), currency selection, and transaction lifecycle APIs.
- **🛠 Admin control plane** — Full CRUD for users, agents, companies, properties, inquiries, news (5-locale content), banners, feature toggles, site design, and social links — with entity detail panels and analytics charts.
- **🌐 Internationalization** — Type-safe translation objects for 5 languages; RTL layout switching; localized country names; legal pages (Privacy & Terms) in AR/EN.
- **⚡ Performance-conscious UI** — Dynamic imports for maps, `viewportOnce` motion variants, lazy images, and admin query caps to avoid over-fetching Firestore.

---

## Architecture & Folder Structure

CIAR uses a **modular monolith** pattern: Next.js serves both the SPA shell and REST-style API routes. Client navigation is virtual (Zustand `currentPage`) for instant transitions; admin uses dedicated full-screen layouts.

```
CIAR-Real/
├── prisma/                  # SQLite schema + seed (local dev / migration source)
├── scripts/                 # Firestore seed & Prisma→Firestore migration scripts
├── public/                  # Static assets, logos
└── src/
    ├── app/
    │   ├── layout.tsx       # Root layout — fonts (Latin + Arabic), theme provider
    │   ├── page.tsx         # SPA router — maps currentPage → page components
    │   ├── globals.css      # Base tokens, glass system, property card styles
    │   ├── estate-modern.css
    │   ├── luxury-ui.css
    │   └── api/             # 50+ Route Handlers (properties, auth, admin, geo, …)
    ├── components/
    │   ├── pages/           # Route-level views (home, search, admin, checkout, …)
    │   ├── admin/           # Admin tabs, entity panels, analytics, news editor
    │   ├── property/        # Property cards and listing UI
    │   ├── layout/          # Header, footer, news ticker, currency switcher
    │   ├── feature/         # Mortgage calc, currency converter, AI chatbot
    │   ├── payment/         # Subscription payment fields & method icons
    │   └── ui/              # shadcn/Radix primitives
    ├── hooks/               # useSiteCurrency, useVisitorCountry, useLocalizedCountryName
    ├── store/
    │   └── app-store.ts     # Zustand — nav, auth, filters, favorites, i18n, design settings
    ├── lib/
    │   ├── firestore-*.ts   # Firestore domain modules (properties, platform, subscriptions)
    │   ├── firestore-read-cache.ts  # TTL + stale cache for quota resilience
    │   ├── demo-*.ts          # Demo marketplace & admin fallback data
    │   ├── i18n/              # Translations & useTranslation hook
    │   ├── site-currency.ts   # 22-currency conversion engine
    │   ├── admin-events.ts    # Cross-tab invalidation bus
    │   └── …                  # Auth, geo, payments, legal content, social links
    └── types/                 # Shared TypeScript contracts
```

**Patterns in use**

| Pattern | Where |
|---------|-------|
| **BFF via Route Handlers** | `src/app/api/*` — single origin for client fetches |
| **Domain modules** | `lib/firestore-properties.ts`, `firestore-platform.ts` — fat lib, thin routes |
| **Custom hooks** | Currency, geo, i18n — keep page components declarative |
| **Persisted client state** | Zustand + `localStorage` for locale, currency, favorites, design |
| **Graceful degradation** | Demo data when Firestore is absent; stale cache when quota is hit |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (or **Bun** for production `start` script)
- **npm** / **pnpm** / **yarn**
- Firebase project with Firestore (optional for local demo mode)

### 1. Clone & install

```bash
git clone https://github.com/alphacode800-web/CIAR-Real.git
cd CIAR-Real
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Local dev | SQLite path for Prisma (`file:./db/custom.db`) |
| `AUTH_SECRET` | Production | Session signing secret |
| `FIREBASE_PROJECT_ID` | Production | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Production | Service account email |
| `FIREBASE_PRIVATE_KEY` | Production | Service account private key (with `\n` escapes) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Alt. | Full JSON on one line instead of the three vars above |
| `FIRESTORE_PROPERTIES_COLLECTION` | Optional | Default: `properties` |
| `FIRESTORE_QUERY_MAX_DOCS` | Optional | Max docs per list query (default `800`) |

> Without Firebase credentials the app runs in **demo mode** — seeded properties, agents, and companies are served from in-memory catalogs.

### 3. Database (optional — Prisma / local)

```bash
npm run db:generate
npm run db:push
# Seed Firestore from Prisma data (requires Firebase configured):
npm run db:migrate-firestore
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Production build

```bash
npm run build
npm run start   # standalone server (Bun)
```

---

## Key Engineering Challenges & Decisions

### 1. Firestore quota resilience without sacrificing UX

**Problem.** Listing endpoints can fan out across hundreds of documents. On the free tier — or under burst traffic — Firestore returns `RESOURCE_EXHAUSTED`. A hard failure leaves the marketplace blank.

**Solution.** A process-level read cache (`firestore-read-cache.ts`) wraps hot queries with TTL-based hits. When a quota error is detected, the handler serves **stale-but-valid** cached data up to a max age instead of erroring. Admin mutations call `invalidateCachedRead` / `invalidateCachedReadPrefix` so users never see permanently stale listings after an edit.

```ts
// Simplified flow in list handlers
const cached = getCachedRead(key, TTL);
if (cached) return cached;

try {
  const fresh = await firestoreQuery();
  setCachedRead(key, fresh);
  return fresh;
} catch (err) {
  if (isFirestoreQuotaError(err)) {
    return getStaleCachedRead(key, STALE_MAX) ?? demoFallback;
  }
  throw err;
}
```

### 2. One codebase, three runtime modes (Firestore · Demo · Prisma)

**Problem.** Contributors need to run the app without Firebase. Production needs Firestore. Legacy data still lives in Prisma/SQLite.

**Solution.** API routes branch on `isFirebaseAdminConfigured()` and merge layers:

1. **Firestore** — source of truth when credentials exist.
2. **Demo catalogs** (`demo-marketplace.ts`, `demo-admin-data.ts`) — realistic Arabic/English seed data for agents, companies, and 8 properties per entity per country.
3. **Prisma** — local schema + `migrate-prisma-to-firestore.cjs` for one-way migration.

This keeps `npm run dev` zero-config while production deploys stay identical — no separate demo branch.

### 3. Admin mutations → live public UI (multi-tab)

**Problem.** An admin disables a feature flag or publishes news; open browser tabs still show old data until a manual refresh.

**Solution.** `admin-events.ts` publishes invalidation events on both `window` (same tab) and `localStorage` (cross-tab). Public components subscribe in `useEffect` and re-fetch only their resource (`features`, `news`, `favorites`, …). The home page ticker, header, and feature-gated widgets stay in sync without WebSockets or polling.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (webpack) on `:3000` |
| `npm run dev:turbo` | Development with Turbopack |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Run standalone server |
| `npm run lint` | ESLint |
| `npm run db:seed-firestore` | Seed Firestore properties |
| `npm run db:migrate-firestore` | Migrate Prisma data → Firestore |

---

## License

Private — © CIAR. All rights reserved.
