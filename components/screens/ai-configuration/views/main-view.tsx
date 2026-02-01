import { ScrollView } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { ProviderListSection, ModelSelectionSection, AboutSection } from '../sections';
import type { UseAIConfigurationReturn } from '../hooks';

type MainViewProps = Pick<
  UseAIConfigurationReturn,
  | 'settings'
  | 'expandedProvider'
  | 'providerInputs'
  | 'verifyingProviders'
  | 'providerErrors'
  | 'configuredProviders'
  | 'toggleProvider'
  | 'setProviderApiKey'
  | 'verifyProvider'
  | 'removeProvider'
  | 'setActiveSection'
> & {
  onSelectModel: () => void;
};

/**
 * MainView - The main AI configuration screen
 *
 * Displays:
 * - Expandable list of providers for API key configuration
 * - Model selection options (primary/secondary)
 * - Information about the BYOK model
 */
export function MainView({
  settings,
  expandedProvider,
  providerInputs,
  verifyingProviders,
  providerErrors,
  configuredProviders,
  toggleProvider,
  setProviderApiKey,
  verifyProvider,
  removeProvider,
  onSelectModel,
}: MainViewProps) {
  const { spacing } = useAppTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
      }}
    >
      <ProviderListSection
        settings={settings}
        expandedProvider={expandedProvider}
        providerInputs={providerInputs}
        verifyingProviders={verifyingProviders}
        providerErrors={providerErrors}
        onToggleProvider={toggleProvider}
        onApiKeyChange={setProviderApiKey}
        onVerify={verifyProvider}
        onRemove={removeProvider}
      />

      <ModelSelectionSection
        settings={settings}
        configuredProviders={configuredProviders}
        onSelectModel={onSelectModel}
      />

      <AboutSection />
    </ScrollView>
  );
}
