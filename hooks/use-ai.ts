import { useCallback, useEffect, useState } from 'react';
import {
  getAISettings,
  setApiKey,
  setPrimaryModel,
  setSecondaryModel,
  removeApiKey,
  clearAISettings,
  type ModelConfig,
  type AISettings,
  RECOMMENDED_MODELS,
} from '@/lib/ai/settings';
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

  // Settings management
  saveApiKey: (apiKey: string) => Promise<void>;
  savePrimaryModel: (config: ModelConfig) => Promise<void>;
  saveSecondaryModel: (config: ModelConfig) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  clearAllSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;

  // AI completion
  chat: (options: ChatCompletionOptions) => Promise<ChatCompletionResult>;

  // Constants
  recommendedModels: typeof RECOMMENDED_MODELS;
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

  const saveApiKey = useCallback(async (apiKey: string) => {
    try {
      setError(null);
      await setApiKey(apiKey);
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save API key';
      setError(message);
      throw err;
    }
  }, [loadSettings]);

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

  const deleteApiKey = useCallback(async () => {
    try {
      setError(null);
      await removeApiKey();
      await loadSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
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
    saveApiKey,
    savePrimaryModel,
    saveSecondaryModel,
    deleteApiKey,
    clearAllSettings,
    refreshSettings,
    chat,
    recommendedModels: RECOMMENDED_MODELS,
  };
}

export type { Message, ChatCompletionOptions, ChatCompletionResult, ModelConfig, AISettings };
export { AIProviderError, RECOMMENDED_MODELS };
