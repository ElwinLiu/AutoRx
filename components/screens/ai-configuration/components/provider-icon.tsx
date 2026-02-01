import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { ProviderIconProps } from '../types';

/**
 * ProviderIcon - Displays the appropriate icon for each AI provider
 *
 * Uses Ionicons for built-in icons. For custom provider icons,
 * you can replace this with Image components loading from assets.
 */
export function ProviderIcon({ provider, size = 24 }: ProviderIconProps) {
  const { colors } = useAppTheme();

  switch (provider) {
    case 'openai':
      // Use sparkles as OpenAI doesn't have an official icon in Ionicons
      // TODO: Replace with custom OpenAI logo asset if needed
      return <Ionicons name="sparkles" size={size} color={colors.textPrimary} />;
    case 'openrouter':
      // Use a globe icon for OpenRouter as a fallback
      // TODO: Replace with actual OpenRouter logo asset
      return <Ionicons name="globe" size={size} color="#3B82F6" />;
    default:
      return <Ionicons name="hardware-chip" size={size} color={colors.textSecondary} />;
  }
}
