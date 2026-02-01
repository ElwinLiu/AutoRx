import { View, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { PROVIDERS, type ProviderId } from '@/lib/ai/settings';
import { ProviderItem } from '../components';
import type { AISettings } from '@/hooks/use-ai';

type ProviderListSectionProps = {
  settings: AISettings | null;
  expandedProvider: ProviderId | null;
  providerInputs: Record<ProviderId, string>;
  verifyingProviders: Record<ProviderId, boolean>;
  providerErrors: Record<ProviderId, string | null>;
  onToggleProvider: (provider: ProviderId) => void;
  onApiKeyChange: (provider: ProviderId, value: string) => void;
  onVerify: (provider: ProviderId) => void;
  onRemove: (provider: ProviderId) => void;
};

/**
 * ProviderListSection - Displays the list of AI providers with expandable configuration
 *
 * Features:
 * - Shows all available providers with icons and descriptions
 * - Each provider can be expanded to reveal API key input
 * - Shows verification status for configured providers
 */
export function ProviderListSection({
  settings,
  expandedProvider,
  providerInputs,
  verifyingProviders,
  providerErrors,
  onToggleProvider,
  onApiKeyChange,
  onVerify,
  onRemove,
}: ProviderListSectionProps) {
  const { colors, spacing, typography } = useAppTheme();

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
        API Providers
      </Text>
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderPrimary,
          overflow: 'hidden',
        }}
      >
        {(Object.keys(PROVIDERS) as ProviderId[]).map((provider) => (
          <ProviderItem
            key={provider}
            provider={provider}
            isExpanded={expandedProvider === provider}
            onToggle={() => onToggleProvider(provider)}
            apiKey={providerInputs[provider]}
            onApiKeyChange={(value) => onApiKeyChange(provider, value)}
            onVerify={() => onVerify(provider)}
            isVerifying={verifyingProviders[provider]}
            isVerified={!!settings?.providerKeys[provider]}
            onRemove={() => onRemove(provider)}
            verificationError={providerErrors[provider]}
          />
        ))}
      </View>
    </View>
  );
}
