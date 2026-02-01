import { ScrollView, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { ModelList } from '../components';
import type { UseAIConfigurationReturn } from '../hooks';

type ModelSelectionViewProps = Pick<
  UseAIConfigurationReturn,
  | 'settings'
  | 'allAvailableModels'
  | 'isSaving'
  | 'selectPrimaryModel'
  | 'selectSecondaryModel'
> & {
  type: 'primary' | 'secondary';
  onBack: () => void;
};

/**
 * ModelSelectionView - Screen for selecting a model from available providers
 *
 * Displays a scrollable list of all models from verified providers.
 * Used for both primary and secondary model selection.
 */
export function ModelSelectionView({
  settings,
  allAvailableModels,
  isSaving,
  selectPrimaryModel,
  selectSecondaryModel,
  type,
}: ModelSelectionViewProps) {
  const { colors, spacing, typography } = useAppTheme();

  const isPrimary = type === 'primary';
  const description = isPrimary
    ? 'The primary model is used for high-quality responses. Choose a capable model from your configured providers.'
    : 'The secondary model is used for simpler, faster tasks. Choose a cheaper model from your configured providers.';
  const selectedModel = isPrimary ? settings?.primaryModel : settings?.secondaryModel;
  const onSelect = isPrimary ? selectPrimaryModel : selectSecondaryModel;
  const emptyMessage = 'No providers configured. Please add an API key from a provider first.';

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
      }}
    >
      <Text
        style={{
          ...typography.callout,
          color: colors.textSecondary,
          lineHeight: 20,
          marginBottom: spacing.lg,
        }}
      >
        {description}
      </Text>

      <ModelList
        models={allAvailableModels}
        selectedModel={selectedModel}
        isSaving={isSaving}
        onSelect={onSelect}
        emptyMessage={emptyMessage}
      />
    </ScrollView>
  );
}
