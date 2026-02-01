import { View } from 'react-native';
import { Image } from 'expo-image';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { ProviderIconProps } from '../types';

// Import SVG logos as static assets
const openaiLogo = require('@/assets/images/openai-logo.svg');
const openrouterLogo = require('@/assets/images/openrouter-logo.svg');

/**
 * ProviderIcon - Displays the appropriate icon for each AI provider
 *
 * Uses custom SVG logos for OpenAI and OpenRouter providers.
 * Falls back to a generic icon for unknown providers.
 */
export function ProviderIcon({ provider, size = 24 }: ProviderIconProps) {
  const { colors } = useAppTheme();

  switch (provider) {
    case 'openai':
      return (
        <Image
          source={openaiLogo}
          style={{ width: size, height: size }}
          contentFit="contain"
        />
      );
    case 'openrouter':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={openrouterLogo}
            style={{ width: size, height: size }}
            contentFit="contain"
            tintColor={colors.textPrimary}
          />
        </View>
      );
    default:
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 4,
            backgroundColor: colors.surfaceSecondary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: size / 8,
              backgroundColor: colors.textSecondary,
            }}
          />
        </View>
      );
  }
}
