import { useState, useCallback, useEffect, useMemo } from 'react';

import {
  useAI,
  type ProviderId,
  type ModelConfig,
  type FetchedModel,
  type AISettings,
  PROVIDERS,
} from '@/hooks/use-ai';

export type AIConfigSection = 'main' | 'primary' | 'secondary';

export type UseAIConfigurationReturn = {
  // State
  settings: AISettings | null;
  isLoading: boolean;
  activeSection: AIConfigSection;
  expandedProvider: ProviderId | null;
  providerInputs: Record<ProviderId, string>;
  verifyingProviders: Record<ProviderId, boolean>;
  providerErrors: Record<ProviderId, string | null>;
  availableModels: Record<ProviderId, FetchedModel[]>;
  isSaving: boolean;

  // Computed
  allAvailableModels: (FetchedModel & { provider: ProviderId })[];
  configuredProviders: ProviderId[];
  hasVerifiedProviders: boolean;

  // Actions
  setActiveSection: (section: AIConfigSection) => void;
  toggleProvider: (provider: ProviderId) => void;
  setProviderApiKey: (provider: ProviderId, value: string) => void;
  verifyProvider: (provider: ProviderId) => Promise<void>;
  removeProvider: (provider: ProviderId) => Promise<void>;
  selectPrimaryModel: (model: ModelConfig) => Promise<void>;
  selectSecondaryModel: (model: ModelConfig) => Promise<void>;
  refresh: () => Promise<void>;
};

/**
 * useAIConfiguration - Custom hook for managing AI configuration state
 *
 * Encapsulates all the complex state management for the AI configuration screen:
 * - Provider expansion/collapse
 * - API key input handling
 * - Verification flow
 * - Model fetching and selection
 *
 * This follows the pattern of co-locating related state and logic
 * to make the component code cleaner and more maintainable.
 */
export function useAIConfiguration(): UseAIConfigurationReturn {
  const {
    settings,
    isLoading,
    saveProviderApiKey,
    deleteProviderApiKey,
    verifyProviderKey,
    fetchProviderModels,
    savePrimaryModel,
    saveSecondaryModel,
    refreshSettings,
  } = useAI();

  const [activeSection, setActiveSection] = useState<AIConfigSection>('main');
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>(null);
  const [providerInputs, setProviderInputs] = useState<Record<ProviderId, string>>({
    openai: '',
    openrouter: '',
  });
  const [verifyingProviders, setVerifyingProviders] = useState<Record<ProviderId, boolean>>({
    openai: false,
    openrouter: false,
  });
  const [providerErrors, setProviderErrors] = useState<Record<ProviderId, string | null>>({
    openai: null,
    openrouter: null,
  });
  const [availableModels, setAvailableModels] = useState<Record<ProviderId, FetchedModel[]>>({
    openai: [],
    openrouter: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    refreshSettings();
    setExpandedProvider(null);
    setActiveSection('main');
  }, [refreshSettings]);

  // Fetch models when providers are verified
  useEffect(() => {
    const loadModels = async () => {
      const currentSettings = settings;
      if (!currentSettings) return;

      for (const provider of Object.keys(PROVIDERS) as ProviderId[]) {
        if (currentSettings.providerKeys[provider]) {
          const models = await fetchProviderModels(provider);
          setAvailableModels((prev) => ({ ...prev, [provider]: models }));
        }
      }
    };

    loadModels();
  }, [settings, fetchProviderModels]);

  // Computed values
  const allAvailableModels = useMemo(() => {
    const models: (FetchedModel & { provider: ProviderId })[] = [];
    for (const [provider, providerModels] of Object.entries(availableModels)) {
      for (const model of providerModels) {
        models.push({ ...model, provider: provider as ProviderId });
      }
    }
    return models;
  }, [availableModels]);

  const configuredProviders = useMemo(() => {
    return Object.entries(settings?.providerKeys ?? {})
      .filter(([, key]) => key !== null)
      .map(([provider]) => provider as ProviderId);
  }, [settings?.providerKeys]);

  const hasVerifiedProviders = configuredProviders.length > 0;

  // Actions
  const toggleProvider = useCallback((provider: ProviderId) => {
    setExpandedProvider((current) => (current === provider ? null : provider));
    setProviderErrors((prev) => ({ ...prev, [provider]: null }));
  }, []);

  const setProviderApiKey = useCallback((provider: ProviderId, value: string) => {
    setProviderInputs((prev) => ({ ...prev, [provider]: value }));
    setProviderErrors((prev) => ({ ...prev, [provider]: null }));
  }, []);

  const verifyProvider = useCallback(
    async (provider: ProviderId) => {
      const apiKey = providerInputs[provider].trim();
      if (!apiKey) return;

      setVerifyingProviders((prev) => ({ ...prev, [provider]: true }));
      setProviderErrors((prev) => ({ ...prev, [provider]: null }));

      try {
        const result = await verifyProviderKey(provider, apiKey);

        if (result.valid) {
          await saveProviderApiKey(provider, apiKey);
          setProviderInputs((prev) => ({ ...prev, [provider]: '' }));
          if (result.models) {
            setAvailableModels((prev) => ({ ...prev, [provider]: result.models! }));
          }
        } else {
          setProviderErrors((prev) => ({
            ...prev,
            [provider]: result.error || 'Verification failed',
          }));
        }
      } catch {
        setProviderErrors((prev) => ({
          ...prev,
          [provider]: 'An unexpected error occurred',
        }));
      } finally {
        setVerifyingProviders((prev) => ({ ...prev, [provider]: false }));
      }
    },
    [providerInputs, verifyProviderKey, saveProviderApiKey]
  );

  const removeProvider = useCallback(
    async (provider: ProviderId) => {
      await deleteProviderApiKey(provider);
      setAvailableModels((prev) => ({ ...prev, [provider]: [] }));
    },
    [deleteProviderApiKey]
  );

  const selectPrimaryModel = useCallback(
    async (model: ModelConfig) => {
      setIsSaving(true);
      try {
        await savePrimaryModel(model);
        setActiveSection('main');
      } finally {
        setIsSaving(false);
      }
    },
    [savePrimaryModel]
  );

  const selectSecondaryModel = useCallback(
    async (model: ModelConfig) => {
      setIsSaving(true);
      try {
        await saveSecondaryModel(model);
        setActiveSection('main');
      } finally {
        setIsSaving(false);
      }
    },
    [saveSecondaryModel]
  );

  const refresh = useCallback(async () => {
    await refreshSettings();
  }, [refreshSettings]);

  return {
    // State
    settings,
    isLoading,
    activeSection,
    expandedProvider,
    providerInputs,
    verifyingProviders,
    providerErrors,
    availableModels,
    isSaving,

    // Computed
    allAvailableModels,
    configuredProviders,
    hasVerifiedProviders,

    // Actions
    setActiveSection,
    toggleProvider,
    setProviderApiKey,
    verifyProvider,
    removeProvider,
    selectPrimaryModel,
    selectSecondaryModel,
    refresh,
  };
}
