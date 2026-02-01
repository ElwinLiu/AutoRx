import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { AISettings, ProviderId } from '@/hooks/use-ai';
import { ProviderIcon } from '../components/provider-icon';

type ModelSelectionSectionProps = {
  settings: AISettings | null;
  configuredProviders: ProviderId[];
  onSelectModel: () => void;
};

/**
 * ModelSelectionSection - Displays model configuration with single selection entry
 *
 * Features:
 * - Single "Select Model" button to open model picker
 * - Read-only display of configured primary and secondary models
 * - Clean, simple text-based display for configured models
 */
export function ModelSelectionSection({
  settings,
  configuredProviders,
  onSelectModel,
}: ModelSelectionSectionProps) {
  const { colors, spacing, typography, radius } = useAppTheme();

  const hasProviders = configuredProviders.length > 0;
  const primaryModel = settings?.primaryModel;
  const secondaryModel = settings?.secondaryModel;

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

      {/* Select Model Button */}
      <Pressable
        onPress={onSelectModel}
        disabled={!hasProviders}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          opacity: hasProviders ? 1 : 0.5,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="cube-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
              Select Model
            </Text>
            <Text
              style={{ ...typography.callout, color: colors.textSecondary }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {hasProviders
                ? 'Choose from available models'
                : 'Configure a provider first'}
            </Text>
          </View>
        </View>
        <View style={{ width: 20, alignItems: 'center' }}>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Pressable>

      {/* Configured Models Info */}
      {(primaryModel || secondaryModel) && (
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.lg,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.borderPrimary,
            gap: spacing.md,
          }}
        >
          {/* Primary Model Info */}
          {primaryModel && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: 100 }}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <Text style={{ ...typography.footnote, color: colors.textSecondary }}>
                  Primary:
                </Text>
              </View>
              <Text
                style={{ ...typography.callout, color: colors.textPrimary, flex: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {primaryModel.name || primaryModel.modelId}
              </Text>
              <View style={{ width: 24, alignItems: 'center' }}>
                <ProviderIcon provider={primaryModel.provider} size={16} />
              </View>
            </View>
          )}

          {/* Secondary Model Info */}
          {secondaryModel && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: 100 }}>
                <Ionicons name="flash" size={16} color={colors.warning} />
                <Text style={{ ...typography.footnote, color: colors.textSecondary }}>
                  Secondary:
                </Text>
              </View>
              <Text
                style={{ ...typography.callout, color: colors.textPrimary, flex: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {secondaryModel.name || secondaryModel.modelId}
              </Text>
              <View style={{ width: 24, alignItems: 'center' }}>
                <ProviderIcon provider={secondaryModel.provider} size={16} />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}


