import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS } from '@/lib/ai/settings';
import type { AISettings, ProviderId } from '@/hooks/use-ai';
import type { AIConfigSection } from '../hooks';

type ModelSelectionSectionProps = {
  settings: AISettings | null;
  configuredProviders: ProviderId[];
  onSelectSection: (section: AIConfigSection) => void;
};

/**
 * ModelSelectionSection - Displays the primary and secondary model selection options
 *
 * Features:
 * - Shows current model configuration status
 * - Navigates to model selection screens
 * - Displays helpful messages based on provider configuration state
 */
export function ModelSelectionSection({
  settings,
  configuredProviders,
  onSelectSection,
}: ModelSelectionSectionProps) {
  const { colors, spacing, typography, radius } = useAppTheme();

  const getModelDisplayText = (model: AISettings['primaryModel']) => {
    if (!model) {
      return configuredProviders.length > 0
        ? 'Select a model'
        : 'Configure a provider first';
    }
    return `${PROVIDERS[model.provider].name} · ${model.name || model.modelId}`;
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          ...typography.footnote,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: spacing.sm,
          marginLeft: spacing.md,
        }}
      >
        Models
      </Text>
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
        }}
      >
        {/* Primary Model */}
        <Pressable
          onPress={() => onSelectSection('primary')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderColor: colors.borderSecondary,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                Primary Model
              </Text>
              <Text
                style={{ ...typography.callout, color: colors.textSecondary }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getModelDisplayText(settings?.primaryModel)}
              </Text>
            </View>
          </View>
          <View style={{ width: 20, alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Pressable>

        {/* Secondary Model */}
        <Pressable
          onPress={() => onSelectSection('secondary')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="flash" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                Secondary Model
              </Text>
              <Text
                style={{ ...typography.callout, color: colors.textSecondary }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getModelDisplayText(settings?.secondaryModel)}
              </Text>
            </View>
          </View>
          <View style={{ width: 20, alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
