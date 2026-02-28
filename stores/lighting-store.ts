import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightingCalculator } from '@/utils/lighting-calculator';
import { CalculationResponse } from '@/types/lighting';

export interface SavedCalculation {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  fixture: string;
  inputs: {
    verticalHeight: string;
    horizontalDistance: string;
    beamWidth: string;
    beamHeight: string;
    rectHeight: string;
    rectWidth: string;
    rectDepth: string;
  };
  result: CalculationResponse;
  projectId?: string;
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
  aiInsight?: string;
}

interface LightingState {
  selectedFixture: string;
  verticalHeight: string;
  horizontalDistance: string;
  beamWidth: string;
  beamHeight: string;
  rectHeight: string;
  rectWidth: string;
  rectDepth: string;
  isCalculating: boolean;
  showingPreview: boolean;
  lastCalculation: CalculationResponse | null;
  savedCalculations: SavedCalculation[];
  isQRScannerOpen: boolean;
  setSelectedFixture: (fixture: string) => void;
  setVerticalHeight: (height: string) => void;
  setHorizontalDistance: (distance: string) => void;
  setBeamWidth: (width: string) => void;
  setBeamHeight: (height: string) => void;
  setRectHeight: (height: string) => void;
  setRectWidth: (width: string) => void;
  setRectDepth: (depth: string) => void;
  calculate: () => Promise<void>;
  resetInputs: () => void;
  clearResult: () => void;
  openQRScanner: () => void;
  closeQRScanner: () => void;
  handleQRScan: (data: string) => void;
  saveCalculation: (name: string, description?: string, projectId?: string, aiInsight?: string) => boolean;
  deleteCalculation: (id: string) => void;
  loadCalculation: (id: string) => void;
  getSafetyLevel: (result: CalculationResponse) => 'safe' | 'caution' | 'warning' | 'danger';
}

export const useLightingStore = create<LightingState>()(
  persist(
    (set, get) => ({
      selectedFixture: '',
      verticalHeight: '',
      horizontalDistance: '',
      beamWidth: '',
      beamHeight: '',
      rectHeight: '',
      rectWidth: '',
      rectDepth: '',
      isCalculating: false,
      showingPreview: false,
      lastCalculation: null,
      savedCalculations: [],
      isQRScannerOpen: false,

      setSelectedFixture: (fixture) => set({ selectedFixture: fixture }),
      setVerticalHeight: (height) => set({ verticalHeight: height }),
      setHorizontalDistance: (distance) => set({ horizontalDistance: distance }),
      setBeamWidth: (width) => set({ beamWidth: width }),
      setBeamHeight: (height) => set({ beamHeight: height }),
      setRectHeight: (height) => set({ rectHeight: height }),
      setRectWidth: (width) => set({ rectWidth: width }),
      setRectDepth: (depth) => set({ rectDepth: depth }),

      calculate: async () => {
        const state = get();
        set({ isCalculating: true, showingPreview: false });
        try {
          const calculator = new LightingCalculator();
          const result = calculator.calculateRadiometricData(
            state.selectedFixture,
            parseFloat(state.verticalHeight) || 0,
            parseFloat(state.horizontalDistance) || 0,
            parseFloat(state.beamWidth) || 12.0,
            parseFloat(state.beamHeight) || 12.0,
            parseFloat(state.rectHeight) || 3.0,
            parseFloat(state.rectWidth) || 3.0,
            parseFloat(state.rectDepth) || 3.0
          );
          set({ lastCalculation: result, isCalculating: false, showingPreview: true });
          setTimeout(() => { set({ showingPreview: false }); }, 4000);
        } catch {
          set({
            lastCalculation: { error: 'Calculation failed. Please check your inputs.' },
            isCalculating: false,
            showingPreview: false,
          });
        }
      },

      resetInputs: () => set({
        selectedFixture: '',
        verticalHeight: '',
        horizontalDistance: '',
        beamWidth: '',
        beamHeight: '',
        rectHeight: '',
        rectWidth: '',
        rectDepth: '',
        lastCalculation: null,
      }),

      clearResult: () => set({ lastCalculation: null, showingPreview: false }),
      openQRScanner: () => set({ isQRScannerOpen: true }),
      closeQRScanner: () => set({ isQRScannerOpen: false }),

      handleQRScan: (data: string) => {
        try {
          const qrData = JSON.parse(data);
          if (qrData.fixture && LightingCalculator.getFixtureModels().includes(qrData.fixture)) {
            set({ selectedFixture: qrData.fixture, isQRScannerOpen: false });
          }
        } catch {
          if (LightingCalculator.getFixtureModels().includes(data)) {
            set({ selectedFixture: data, isQRScannerOpen: false });
          }
        }
      },

      saveCalculation: (name: string, description?: string, projectId?: string, aiInsight?: string) => {
        const state = get();
        if (!state.lastCalculation || 'error' in state.lastCalculation) {
          console.log('saveCalculation skipped: missing or invalid lastCalculation');
          return false;
        }
        const timestamp = Date.now();
        const calculation: SavedCalculation = {
          id: `${timestamp}-${Math.floor(Math.random() * 100000)}`,
          name,
          description,
          timestamp,
          fixture: state.selectedFixture,
          inputs: {
            verticalHeight: state.verticalHeight,
            horizontalDistance: state.horizontalDistance,
            beamWidth: state.beamWidth,
            beamHeight: state.beamHeight,
            rectHeight: state.rectHeight,
            rectWidth: state.rectWidth,
            rectDepth: state.rectDepth,
          },
          result: state.lastCalculation,
          projectId,
          safetyLevel: state.getSafetyLevel(state.lastCalculation),
          aiInsight: aiInsight || undefined,
        };
        set(s => ({ savedCalculations: [calculation, ...s.savedCalculations] }));
        console.log('saveCalculation success:', calculation.id, calculation.name);
        return true;
      },

      deleteCalculation: (id: string) => {
        set(s => ({ savedCalculations: s.savedCalculations.filter(c => c.id !== id) }));
      },

      loadCalculation: (id: string) => {
        const state = get();
        const calc = state.savedCalculations.find(c => c.id === id);
        if (calc) {
          set({
            selectedFixture: calc.fixture,
            verticalHeight: calc.inputs.verticalHeight,
            horizontalDistance: calc.inputs.horizontalDistance,
            beamWidth: calc.inputs.beamWidth,
            beamHeight: calc.inputs.beamHeight,
            rectHeight: calc.inputs.rectHeight,
            rectWidth: calc.inputs.rectWidth,
            rectDepth: calc.inputs.rectDepth,
            lastCalculation: calc.result,
          });
        }
      },

      getSafetyLevel: (result: CalculationResponse) => {
        if ('error' in result) return 'safe';
        const irr = result.irradiance_report.irradiance_mWm2;
        if (irr > 25000) return 'danger';
        if (irr > 10000) return 'warning';
        if (irr > 2500) return 'caution';
        return 'safe';
      },
    }),
    {
      name: 'lighting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedCalculations: state.savedCalculations,
        selectedFixture: state.selectedFixture,
        verticalHeight: state.verticalHeight,
        horizontalDistance: state.horizontalDistance,
        beamWidth: state.beamWidth,
        beamHeight: state.beamHeight,
        rectHeight: state.rectHeight,
        rectWidth: state.rectWidth,
        rectDepth: state.rectDepth,
      }),
    }
  )
);
