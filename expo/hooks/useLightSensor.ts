import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

interface LightSensorData {
  illuminance: number;
  timestamp: number;
}

interface UseLightSensorResult {
  illuminance: number | null;
  isAvailable: boolean;
  isActive: boolean;
  start: () => void;
  stop: () => void;
  getLuxCategory: () => string;
  getLuxRecommendation: () => string;
}

const LUX_CATEGORIES = [
  { max: 1, label: 'Pitch Black', rec: 'Ideal for UV-only environments. Maximum fluorescence visibility.' },
  { max: 50, label: 'Very Dark', rec: 'Excellent for UV effects. Minimal ambient light interference.' },
  { max: 200, label: 'Dim', rec: 'Good for UV effects. Some ambient light present but UV will still be visible.' },
  { max: 500, label: 'Moderate', rec: 'UV effects partially visible. Consider reducing ambient lighting for best results.' },
  { max: 1000, label: 'Bright Indoor', rec: 'UV effects will be faint. Strongly recommend darkening the space.' },
  { max: 10000, label: 'Bright', rec: 'UV effects will not be visible. Full blackout required for UV applications.' },
  { max: Infinity, label: 'Daylight / Direct Sun', rec: 'UV effects invisible. Indoor blackout environment required.' },
] as const;

export function useLightSensor(): UseLightSensorResult {
  const [illuminance, setIlluminance] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      checkAvailability();
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  const checkAvailability = async () => {
    try {
      const { LightSensor } = await import('expo-sensors');
      const available = await LightSensor.isAvailableAsync();
      setIsAvailable(available);
      console.log('[LightSensor] Available:', available);
    } catch (error) {
      console.log('[LightSensor] Not available:', error);
      setIsAvailable(false);
    }
  };

  const start = useCallback(async () => {
    if (Platform.OS !== 'android') {
      console.log('[LightSensor] Only available on Android');
      return;
    }
    try {
      const { LightSensor } = await import('expo-sensors');
      const available = await LightSensor.isAvailableAsync();
      if (!available) {
        console.log('[LightSensor] Sensor not available on this device');
        return;
      }
      LightSensor.setUpdateInterval(500);
      subscriptionRef.current = LightSensor.addListener((data: LightSensorData) => {
        setIlluminance(data.illuminance);
      });
      setIsActive(true);
      console.log('[LightSensor] Started');
    } catch (error) {
      console.log('[LightSensor] Error starting:', error);
    }
  }, []);

  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsActive(false);
    console.log('[LightSensor] Stopped');
  }, []);

  const getLuxCategory = useCallback((): string => {
    if (illuminance === null) return 'Unknown';
    const category = LUX_CATEGORIES.find(c => illuminance <= c.max);
    return category?.label ?? 'Unknown';
  }, [illuminance]);

  const getLuxRecommendation = useCallback((): string => {
    if (illuminance === null) return 'Start the light sensor to measure ambient light levels.';
    const category = LUX_CATEGORIES.find(c => illuminance <= c.max);
    return category?.rec ?? '';
  }, [illuminance]);

  return {
    illuminance,
    isAvailable,
    isActive,
    start,
    stop,
    getLuxCategory,
    getLuxRecommendation,
  };
}
