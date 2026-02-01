import { View, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { ModelCard } from './model-card';
import type { ModelListProps } from '../types';

/**
 * ModelList - Displays a scrollable list of available models
 *
 * Features:
 * - Renders model cards with selection state
 * - Handles empty state with appropriate message
 * - Groups models by provider (optional enhancement)
 *
 * Performance considerations:
 * - For very long lists, consider using FlashList instead of ScrollView
 * - Memoize model items if list performance becomes an issue
 */
export function ModelList({
  models,
  selectedModel,
  isSaving,
  onSelect,
  emptyMessage,
}: ModelListProps) {
  const { colors, spacing, typography } = useAppTheme();

  if (models.length === 0) {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xl * 2,
          gap: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.callout,
            color: colors.textSecondary,
            textAlign: 'center',
            paddingHorizontal: spacing.lg,
          }}
        >
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {models.map((model) => {
        const isSelected = selectedModel?.modelId === model.id;
        return (
          <ModelCard
            key={`${model.provider}-${model.id}`}
            model={model}
            isSelected={isSelected}
            isDisabled={isSaving}
            onPress={() =>
              onSelect({
                provider: model.provider,
                modelId: model.id,
                name: model.name,
                description: model.description,
                contextWindow: model.contextWindow,
              })
            }
          />
        );
      })}
    </View>
  );
}

/**
 * ModelListSkeleton - Loading state for model list
 */
export function ModelListSkeleton() {
  const { colors, spacing, radius } = useAppTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            height: 72,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
      ))}
    </View>
  );
}
