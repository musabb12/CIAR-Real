import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  User,
  PropertyFilters,
  AppPage,
  AccountType,
  Favorite,
  SiteDesignSettings,
  SiteSocialSettings,
  SiteContentSettings,
  ManagedPageKey,
  PageContentEntry,
} from '@/types';
import type { Locale } from '@/lib/i18n';

// ============================================================
// Default values
// ============================================================

const defaultFilters: PropertyFilters = {
  sort: 'newest',
  page: 1,
  limit: 30,
};

const defaultDesignSettings: SiteDesignSettings = {
  primaryColor: '#0D9488',
  accentColor: '#F59E0B',
  heroImageUrl:
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80&auto=format&fit=crop',
  newsTickerBackground: '',
  newsTickerTextColor: '',
  newsTickerFontSizePx: 12,
  newsTickerHeightPx: 40,
  newsTickerLabelTextColor: '',
  newsTickerLabelBackground: '',
  newsTickerSeparatorColor: '',
  newsTickerFontFamily: '',
};

const defaultContentSettings: SiteContentSettings = {
  home: {},
  search: {},
  agents: {},
  contact: {},
  favorites: {},
  login: {},
  register: {},
  'admin-login': {},
};

const defaultSocialSettings: SiteSocialSettings = {
  website: '',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  facebook: '',
  instagram: '',
  x: '',
  youtube: '',
  linkedin: '',
  tiktok: '',
};

// ============================================================
// Store interface
// ============================================================

interface AppState {
  // Navigation
  currentPage: AppPage;
  selectedPropertyId: string | null;
  checkoutTransactionId: string | null;
  adminTab: string;
  contentManagerTargetPage: ManagedPageKey | null;
  setCurrentPage: (page: AppPage) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setCheckoutTransactionId: (id: string | null) => void;
  setAdminTab: (tab: string) => void;
  setContentManagerTargetPage: (page: ManagedPageKey | null) => void;

  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  registerAccountTypePreset: AccountType | null;
  setRegisterAccountTypePreset: (type: AccountType | null) => void;

  // Filters
  filters: PropertyFilters;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  visitorGeoResolved: boolean;
  setVisitorGeoResolved: (resolved: boolean) => void;

  // Favorites
  favorites: Favorite[];
  favoritePropertyIds: Set<string>;
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => boolean;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // i18n
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Features
  features: Record<string, boolean>;
  setFeatures: (features: Record<string, boolean>) => void;
  toggleFeature: (key: string, enabled: boolean) => void;
  isFeatureEnabled: (key: string) => boolean;

  // Site design controls (admin)
  designSettings: SiteDesignSettings;
  updateDesignSettings: (partial: Partial<SiteDesignSettings>) => void;
  resetDesignSettings: () => void;

  // Per-page content controls (admin)
  contentSettings: SiteContentSettings;
  updatePageContent: (page: ManagedPageKey, partial: PageContentEntry) => void;
  resetPageContent: (page?: ManagedPageKey) => void;
  socialSettings: SiteSocialSettings;
  updateSocialSettings: (partial: Partial<SiteSocialSettings>) => void;
  resetSocialSettings: () => void;
  hydrateSiteSettings: (payload: {
    designSettings?: Partial<SiteDesignSettings>;
    contentSettings?: Partial<SiteContentSettings>;
    socialSettings?: Partial<SiteSocialSettings>;
  }) => void;
}

// ============================================================
// Store
// ============================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // ---- Navigation ----
  currentPage: 'home',
  selectedPropertyId: null,
  checkoutTransactionId: null,
  adminTab: 'properties',
  contentManagerTargetPage: null,

  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  setCheckoutTransactionId: (id) => set({ checkoutTransactionId: id }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  setContentManagerTargetPage: (page) => set({ contentManagerTargetPage: page }),

  // ---- Auth ----
  currentUser: null,
  isAuthenticated: false,

  login: (user) => set({ currentUser: user, isAuthenticated: true }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),
  registerAccountTypePreset: null,
  setRegisterAccountTypePreset: (type) => set({ registerAccountTypePreset: type }),

  // ---- Filters ----
  filters: { ...defaultFilters },

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  visitorGeoResolved: false,
  setVisitorGeoResolved: (resolved) => set({ visitorGeoResolved: resolved }),

  // ---- Favorites ----
  favorites: [],
  favoritePropertyIds: new Set<string>(),

  setFavorites: (favorites) =>
    set({
      favorites,
      favoritePropertyIds: new Set(favorites.map((f) => f.propertyId)),
    }),

  addFavorite: (favorite) =>
    set((state) => ({
      favorites: [...state.favorites, favorite],
      favoritePropertyIds: new Set([
        ...state.favoritePropertyIds,
        favorite.propertyId,
      ]),
    })),

  removeFavorite: (propertyId) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.propertyId !== propertyId),
      favoritePropertyIds: (() => {
        const next = new Set(state.favoritePropertyIds);
        next.delete(propertyId);
        return next;
      })(),
    })),

  isFavorite: (propertyId) => get().favoritePropertyIds.has(propertyId),

  toggleFavorite: (propertyId) => {
    const { favoritePropertyIds, removeFavorite } = get();
    if (favoritePropertyIds.has(propertyId)) {
      removeFavorite(propertyId);
      return false;
    }
    // Create a minimal Favorite object for optimistic add
    set((state) => ({
      favorites: [
        ...state.favorites,
        {
          id: `temp-${Date.now()}`,
          userId: state.currentUser?.id ?? '',
          propertyId,
          createdAt: new Date().toISOString(),
        },
      ],
      favoritePropertyIds: new Set([...state.favoritePropertyIds, propertyId]),
    }));
    return true;
  },

  // ---- UI ----
  sidebarOpen: false,
  searchQuery: '',

  // ---- i18n ----
  locale: 'ar' as Locale,
  setLocale: (locale) => set({ locale }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // ---- Features ----
  features: {},
  setFeatures: (features) => set({ features }),
  toggleFeature: (key, enabled) => set((state) => ({ features: { ...state.features, [key]: enabled } })),
      isFeatureEnabled: (key) => {
        const state = get();
        if (Object.keys(state.features).length === 0) return true; // Default enabled if not loaded
        return state.features[key] ?? true;
      },

      // ---- Design settings ----
      designSettings: { ...defaultDesignSettings },
      updateDesignSettings: (partial) =>
        set((state) => ({
          designSettings: { ...state.designSettings, ...partial },
        })),
      resetDesignSettings: () =>
        set({
          designSettings: { ...defaultDesignSettings },
        }),

      // ---- Content settings ----
      contentSettings: { ...defaultContentSettings },
      updatePageContent: (page, partial) =>
        set((state) => ({
          contentSettings: {
            ...state.contentSettings,
            [page]: { ...state.contentSettings[page], ...partial },
          },
        })),
      resetPageContent: (page) =>
        set((state) => ({
          contentSettings: page
            ? {
                ...state.contentSettings,
                [page]: {},
              }
            : { ...defaultContentSettings },
        })),
      socialSettings: { ...defaultSocialSettings },
      updateSocialSettings: (partial) =>
        set((state) => ({
          socialSettings: { ...state.socialSettings, ...partial },
        })),
      resetSocialSettings: () =>
        set({
          socialSettings: { ...defaultSocialSettings },
        }),
      hydrateSiteSettings: (payload) =>
        set((state) => ({
          designSettings: {
            ...defaultDesignSettings,
            ...state.designSettings,
            ...(payload.designSettings ?? {}),
          },
          contentSettings: {
            ...state.contentSettings,
            ...(payload.contentSettings ?? {}),
          },
          socialSettings: {
            ...state.socialSettings,
            ...(payload.socialSettings ?? {}),
          },
        })),
    }),
    {
      name: 'ciar-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        locale: state.locale,
        designSettings: state.designSettings,
        contentSettings: state.contentSettings,
        socialSettings: state.socialSettings,
      }),
    },
  ),
);
