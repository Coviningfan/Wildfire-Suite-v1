import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  favoriteResources: string[];
  favoriteTutorials: string[];
  toggleResourceFavorite: (title: string) => void;
  toggleTutorialFavorite: (id: string) => void;
  isResourceFavorite: (title: string) => boolean;
  isTutorialFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteResources: [],
      favoriteTutorials: [],

      toggleResourceFavorite: (title: string) => {
        const state = get();
        const exists = state.favoriteResources.includes(title);
        if (exists) {
          set({ favoriteResources: state.favoriteResources.filter(t => t !== title) });
        } else {
          set({ favoriteResources: [...state.favoriteResources, title] });
        }
      },

      toggleTutorialFavorite: (id: string) => {
        const state = get();
        const exists = state.favoriteTutorials.includes(id);
        if (exists) {
          set({ favoriteTutorials: state.favoriteTutorials.filter(t => t !== id) });
        } else {
          set({ favoriteTutorials: [...state.favoriteTutorials, id] });
        }
      },

      isResourceFavorite: (title: string) => {
        return get().favoriteResources.includes(title);
      },

      isTutorialFavorite: (id: string) => {
        return get().favoriteTutorials.includes(id);
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
