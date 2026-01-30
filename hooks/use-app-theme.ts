import { useColorScheme } from '@/hooks/use-color-scheme';
import { colorTokens, radius, spacing, typography, shadows, type AppColorScheme } from '@/constants/design';

export function useAppTheme() {
  const scheme = (useColorScheme() ?? 'light') as AppColorScheme;

  return {
    scheme,
    colors: colorTokens[scheme],
    radius,
    spacing,
    typography,
    shadows,
  };
}
