import { useCallback, useEffect, useState } from 'react';
import {
  getAISettings,
  setProviderApiKey,
  removeProviderApiKey,
  setPrimaryModel,
  setSecondaryModel,
  clearAISettings,
  getProviderApiKey,
  type ModelConfig,
  type AISettings,
  type ProviderId,
  PROVIDERS,
} from '@/lib/ai/settings';
import {
  verifyProviderApiKey,
  fetchModelsForProvider,
  type FetchedModel,
  type ProviderVerificationResult,
} from '@/lib/ai/model-fetcher';
import {
  completeChat,
  isAIConfigured,
  type Message,
  type ChatCompletionOptions,
  type ChatCompletionResult,
  AIProviderError,
} from '@/lib/ai/provider';

type UseAIReturn = {
  settings: AISettings | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;

  // Provider management
  saveProviderApiKey: (provider: ProviderId, apiKey: string) => Promise<void>;
  deleteProviderApiKey: (provider: ProviderId) => Promise<void>;
  verifyProviderKey: (provider: ProviderId, apiKey: string) => Promise<ProviderVerificationResult>;
  fetchProviderModels: (provider: ProviderId) => Promise<FetchedModel[]>;

  // Settings management
  savePrimaryModel: (config: ModelConfig) => Promise<void>;
  saveSecondaryModel: (config: ModelConfig) => Promise<void>;
  clearAllSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;

  // AI completion
  chat: (options: ChatCompletionOptions) => Promise<ChatCompletionResult>;

  // Constants
  providers: typeof PROVIDERS;
};

export function useAI(): UseAIReturn {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [aiSettings, configured] = await Promise.all([
        getAISettings(),
        isAIConfigured(),
      ]);
      setSettings(aiSettings);
      setIsConfigured(configured);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // New multi-provider methods
  const saveProviderApiKey = useCallback(async (provider: ProviderId, apiKey: string) => {
    try {
      setError(null);
      await setProviderApiKey(provider, apiKey);
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save API key';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

  const deleteProviderApiKey = useCallback(async (provider: ProviderId) => {
    try {
      setError(null);
      await removeProviderApiKey(provider);
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

  const verifyProviderKey = useCallback(async (provider: ProviderId, apiKey: string) => {
    try {
      setError(null);
      return await verifyProviderApiKey(provider, apiKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify API key';
      setError(message);
      return { valid: false, error: message } as ProviderVerificationResult;
    }
  }, []);

  const fetchProviderModels = useCallback(async (provider: ProviderId) => {
    try {
      setError(null);
      const apiKey = await getProviderApiKey(provider);
      if (!apiKey) {
        return [];
      }
      return await fetchModelsForProvider(provider, apiKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(message);
      return [];
    }
  }, []);

  const savePrimaryModel = useCallback(async (config: ModelConfig) => {
    try {
      setError(null);
      await setPrimaryModel(config);
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save primary model';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

  const saveSecondaryModel = useCallback(async (config: ModelConfig) => {
    try {
      setError(null);
      await setSecondaryModel(config);
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save secondary model';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

  const clearAllSettings = useCallback(async () => {
    try {
      setError(null);
      await clearAISettings();
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear settings';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const chat = useCallback(async (options: ChatCompletionOptions): Promise<ChatCompletionResult> => {
    try {
      setError(null);
      return await completeChat(options);
    } catch (err) {
      let message: string;
      if (err instanceof AIProviderError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = 'An unexpected error occurred';
      }
      setError(message);
      throw err;
    }
  }, []);

  return {
    settings,
    isLoading,
    isConfigured,
    error,
    saveProviderApiKey,
    deleteProviderApiKey,
    verifyProviderKey,
    fetchProviderModels,
    savePrimaryModel,
    saveSecondaryModel,
    clearAllSettings,
    refreshSettings,
    chat,
    providers: PROVIDERS,
  };
}

export type { Message, ChatCompletionOptions, ChatCompletionResult, ModelConfig, AISettings, ProviderId, FetchedModel, ProviderVerificationResult };
export { AIProviderError, PROVIDERS };
