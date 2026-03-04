import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SimFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth?: string;
  beamHeight?: string;
  xPos?: number;
  zPos?: number;
}

interface SimulationState {
  zoneFixtures: SimFixture[];
  roomWidth: string;
  roomDepth: string;
  roomCeiling: string;

  addFixture: (fixture: SimFixture) => void;
  removeFixture: (id: string) => void;
  updateFixture: (id: string, field: keyof SimFixture, value: string) => void;
  updateFixturePosition: (id: string, xPos: number, zPos: number) => void;
  setRoomWidth: (width: string) => void;
  setRoomDepth: (depth: string) => void;
  setRoomCeiling: (ceiling: string) => void;
  clearFixtures: () => void;
  addBlankFixture: (id?: string) => void;
  setFixtures: (fixtures: SimFixture[]) => void;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      zoneFixtures: [],
      roomWidth: '12',
      roomDepth: '8',
      roomCeiling: '4',

      addFixture: (fixture) =>
        set((s) => ({ zoneFixtures: [...s.zoneFixtures, fixture] })),

      removeFixture: (id) =>
        set((s) => ({ zoneFixtures: s.zoneFixtures.filter((f) => f.id !== id) })),

      updateFixture: (id, field, value) =>
        set((s) => ({
          zoneFixtures: s.zoneFixtures.map((f) =>
            f.id === id ? { ...f, [field]: value } : f,
          ),
        })),

      updateFixturePosition: (id, xPos, zPos) =>
        set((s) => ({
          zoneFixtures: s.zoneFixtures.map((f) =>
            f.id === id ? { ...f, xPos, zPos } : f,
          ),
        })),

      setRoomWidth: (width) => set({ roomWidth: width }),
      setRoomDepth: (depth) => set({ roomDepth: depth }),
      setRoomCeiling: (ceiling) => set({ roomCeiling: ceiling }),

      clearFixtures: () => set({ zoneFixtures: [] }),

      addBlankFixture: (id?: string) =>
        set((s) => ({
          zoneFixtures: [
            ...s.zoneFixtures,
            {
              id: id ?? `zone-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fixture: '',
              verticalHeight: '',
              horizontalDistance: '',
              beamWidth: '',
              beamHeight: '',
            },
          ],
        })),

      setFixtures: (fixtures) => set({ zoneFixtures: fixtures }),
    }),
    {
      name: 'simulation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        zoneFixtures: state.zoneFixtures,
        roomWidth: state.roomWidth,
        roomDepth: state.roomDepth,
        roomCeiling: state.roomCeiling,
      }),
    },
  ),
);
