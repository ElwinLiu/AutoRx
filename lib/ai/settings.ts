import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  API_KEY: 'ai_api_key',
  PRIMARY_MODEL: 'ai_primary_model',
  SECONDARY_MODEL: 'ai_secondary_model',
} as const;

export type ModelConfig = {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  modelId: string;
  baseUrl?: string;
};

export type AISettings = {
  apiKey: string | null;
  primaryModel: ModelConfig | null;
  secondaryModel: ModelConfig | null;
};

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.API_KEY);
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

export async function setApiKey(apiKey: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.API_KEY, apiKey);
  } catch (error) {
    console.error('Failed to set API key:', error);
    throw error;
  }
}

export async function removeApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY);
  } catch (error) {
    console.error('Failed to remove API key:', error);
    throw error;
  }
}

export async function getPrimaryModel(): Promise<ModelConfig | null> {
  try {
    const json = await SecureStore.getItemAsync(STORAGE_KEYS.PRIMARY_MODEL);
    return json ? (JSON.parse(json) as ModelConfig) : null;
  } catch (error) {
    console.error('Failed to get primary model:', error);
    return null;
  }
}

export async function setPrimaryModel(config: ModelConfig): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.PRIMARY_MODEL,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Failed to set primary model:', error);
    throw error;
  }
}

export async function getSecondaryModel(): Promise<ModelConfig | null> {
  try {
    const json = await SecureStore.getItemAsync(STORAGE_KEYS.SECONDARY_MODEL);
    return json ? (JSON.parse(json) as ModelConfig) : null;
  } catch (error) {
    console.error('Failed to get secondary model:', error);
    return null;
  }
}

export async function setSecondaryModel(config: ModelConfig): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.SECONDARY_MODEL,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Failed to set secondary model:', error);
    throw error;
  }
}

export async function getAISettings(): Promise<AISettings> {
  const [apiKey, primaryModel, secondaryModel] = await Promise.all([
    getApiKey(),
    getPrimaryModel(),
    getSecondaryModel(),
  ]);

  return {
    apiKey,
    primaryModel,
    secondaryModel,
  };
}

export async function clearAISettings(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY),
    SecureStore.deleteItemAsync(STORAGE_KEYS.PRIMARY_MODEL),
    SecureStore.deleteItemAsync(STORAGE_KEYS.SECONDARY_MODEL),
  ]);
}

export const RECOMMENDED_MODELS: { primary: ModelConfig[]; secondary: ModelConfig[] } =
  {
    primary: [
      { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' },
      { provider: 'openai', modelId: 'gpt-4o' },
      { provider: 'openai', modelId: 'gpt-4o-mini' },
      { provider: 'google', modelId: 'gemini-1.5-pro' },
    ],
    secondary: [
      { provider: 'openai', modelId: 'gpt-4o-mini' },
      { provider: 'anthropic', modelId: 'claude-3-5-haiku-20241022' },
      { provider: 'google', modelId: 'gemini-1.5-flash' },
    ],
  };
