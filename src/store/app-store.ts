import { create } from 'zustand';
import type { User, PropertyFilters, AppPage, Favorite } from '@/types';
import type { Locale } from '@/lib/i18n';

// ============================================================
// Default values
// ============================================================

const defaultFilters: PropertyFilters = {
  sort: 'newest',
  page: 1,
  limit: 12,
};

// ============================================================
// Store interface
// ============================================================

interface AppState {
  // Navigation
  currentPage: AppPage;
  selectedPropertyId: string | null;
  adminTab: string;
  setCurrentPage: (page: AppPage) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setAdminTab: (tab: string) => void;

  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Filters
  filters: PropertyFilters;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;

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
}

// ============================================================
// Store
// ============================================================

export const useAppStore = create<AppState>((set, get) => ({
  // ---- Navigation ----
  currentPage: 'home',
  selectedPropertyId: null,
  adminTab: 'properties',

  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  setAdminTab: (tab) => set({ adminTab: tab }),

  // ---- Auth ----
  currentUser: null,
  isAuthenticated: false,

  login: (user) => set({ currentUser: user, isAuthenticated: true }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),

  // ---- Filters ----
  filters: { ...defaultFilters },

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

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
  locale: 'en' as Locale,
  setLocale: (locale) => set({ locale }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
