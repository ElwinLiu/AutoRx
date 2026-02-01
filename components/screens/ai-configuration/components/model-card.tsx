import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS } from '@/lib/ai/settings';
import { ProviderIcon } from './provider-icon';
import type { ModelCardProps } from '../types';

/**
 * ModelCard - Displays a single model option with selection state
 *
 * Features:
 * - Shows provider icon, model name, and context window info
 * - Visual selection state with accent color
 * - Disabled state during save operations
 */
export function ModelCard({ model, isSelected, isDisabled, onPress }: ModelCardProps) {
  const { colors, spacing, typography, radius } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: isSelected ? colors.accent : colors.borderSecondary,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.backgroundSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ProviderIcon provider={model.provider} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
          {model.name}
        </Text>
        <Text style={{ ...typography.footnote, color: colors.textSecondary }}>
          {PROVIDERS[model.provider].name}
          {model.contextWindow ? ` · ${(model.contextWindow / 1000).toFixed(0)}k context` : ''}
        </Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
    </Pressable>
  );
}
