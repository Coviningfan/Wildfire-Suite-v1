import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface SimFixture {
  id: string;
  fixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth?: string;
  beamHeight?: string;
  xPos?: number;
  zPos?: number;
  tiltAngle?: number;
}

interface SimulationState {
  zoneFixtures: SimFixture[];
  roomWidth: string;
  roomDepth: string;
  roomCeiling: string;
  exposureMinutes: string;
  floorMaterial: string;
  ceilingMaterial: string;
  wallMaterial: string;

  addFixture: (fixture: SimFixture) => void;
  removeFixture: (id: string) => void;
  updateFixture: (id: string, field: Exclude<keyof SimFixture, 'id' | 'xPos' | 'zPos'>, value: string) => void;
  updateFixturePosition: (id: string, xPos: number, zPos: number) => void;
  updateFixtureTilt: (id: string, tiltAngle: number) => void;
  setRoomWidth: (width: string) => void;
  setRoomDepth: (depth: string) => void;
  setRoomCeiling: (ceiling: string) => void;
  setExposureMinutes: (minutes: string) => void;
  setFloorMaterial: (material: string) => void;
  setCeilingMaterial: (material: string) => void;
  setWallMaterial: (material: string) => void;
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
      exposureMinutes: '',
      floorMaterial: 'default',
      ceilingMaterial: 'default',
      wallMaterial: 'default',

      addFixture: (fixture) =>
        set((s) => ({ zoneFixtures: [...s.zoneFixtures, fixture] })),

      removeFixture: (id) =>
        set((s) => ({ zoneFixtures: s.zoneFixtures.filter((f) => f.id !== id) })),

      updateFixture: (id, field, value) => {
        const blocked: string[] = ['id', 'xPos', 'zPos'];
        if (blocked.includes(field)) return;
        set((s) => ({
          zoneFixtures: s.zoneFixtures.map((f) =>
            f.id === id ? { ...f, [field]: value } : f,
          ),
        }));
      },

      updateFixturePosition: (id, xPos, zPos) =>
        set((s) => ({
          zoneFixtures: s.zoneFixtures.map((f) =>
            f.id === id ? { ...f, xPos, zPos } : f,
          ),
        })),

      updateFixtureTilt: (id, tiltAngle) =>
        set((s) => ({
          zoneFixtures: s.zoneFixtures.map((f) =>
            f.id === id ? { ...f, tiltAngle } : f,
          ),
        })),

      setRoomWidth: (width) => set({ roomWidth: width }),
      setRoomDepth: (depth) => set({ roomDepth: depth }),
      setRoomCeiling: (ceiling) => set({ roomCeiling: ceiling }),
      setExposureMinutes: (minutes) => set({ exposureMinutes: minutes }),
      setFloorMaterial: (material) => set({ floorMaterial: material }),
      setCeilingMaterial: (material) => set({ ceilingMaterial: material }),
      setWallMaterial: (material) => set({ wallMaterial: material }),

      clearFixtures: () => set({ zoneFixtures: [] }),

      addBlankFixture: (id?: string) =>
        set((s) => {
          const centerX = parseFloat(s.roomWidth) / 2 || 6;
          const centerZ = parseFloat(s.roomDepth) / 2 || 4;
          return {
            zoneFixtures: [
              ...s.zoneFixtures,
              {
                id: id ?? Crypto.randomUUID(),
                fixture: '',
                verticalHeight: '',
                horizontalDistance: '',
                beamWidth: '',
                beamHeight: '',
                xPos: centerX,
                zPos: centerZ,
                tiltAngle: 0,
              },
            ],
          };
        }),

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
        exposureMinutes: state.exposureMinutes,
        floorMaterial: state.floorMaterial,
        ceilingMaterial: state.ceilingMaterial,
        wallMaterial: state.wallMaterial,
      }),
    },
  ),
);
