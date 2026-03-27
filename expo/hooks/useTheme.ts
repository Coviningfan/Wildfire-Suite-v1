import { useSettingsStore } from '@/stores/settings-store';
import { darkColors, lightColors, ThemeColors } from '@/constants/theme';

export function useThemeColors(): ThemeColors {
  const themeMode = useSettingsStore(s => s.themeMode);
  return themeMode === 'dark' ? darkColors : lightColors;
}
