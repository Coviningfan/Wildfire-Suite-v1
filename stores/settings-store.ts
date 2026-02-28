import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UnitSystem = 'metric' | 'imperial';
type ThemeMode = 'dark' | 'light';

interface SettingsState {
  unitSystem: UnitSystem;
  themeMode: ThemeMode;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      unitSystem: 'metric',
      themeMode: 'dark',

      setUnitSystem: (system: UnitSystem) => {
        set({ unitSystem: system });
      },

      toggleUnitSystem: () => {
        const current = get().unitSystem;
        set({ unitSystem: current === 'metric' ? 'imperial' : 'metric' });
      },

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      toggleThemeMode: () => {
        const current = get().themeMode;
        set({ themeMode: current === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const M_TO_FT = 3.28084;
export const FT_TO_M = 1 / M_TO_FT;
export const M2_TO_FT2 = 10.7639;
export const M3_TO_FT3 = 35.3147;

export function convertToMetric(value: number, from: UnitSystem): number {
  return from === 'imperial' ? value * FT_TO_M : value;
}

export function convertDistance(value: number, to: UnitSystem): number {
  return to === 'imperial' ? value * M_TO_FT : value;
}

export function convertArea(value: number, to: UnitSystem): number {
  return to === 'imperial' ? value * M2_TO_FT2 : value;
}

export function convertVolume(value: number, to: UnitSystem): number {
  return to === 'imperial' ? value * M3_TO_FT3 : value;
}

export function distanceUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'ft' : 'm';
}

export function areaUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'ft²' : 'm²';
}

export function volumeUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'ft³' : 'm³';
}
