import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  PROVIDER_KEYS: 'ai_provider_keys',
  PRIMARY_MODEL: 'ai_primary_model',
  SECONDARY_MODEL: 'ai_secondary_model',
} as const;

export type ProviderId = 'openai' | 'openrouter';

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  description: string;
  iconUrl?: string;
  baseUrl: string;
  requiresApiKey: boolean;
  supportsCustomBaseUrl: boolean;
};

export type ModelConfig = {
  provider: ProviderId;
  modelId: string;
  name: string;
  description?: string;
  contextWindow?: number;
};

export type AISettings = {
  providerKeys: Record<ProviderId, string | null>;
  primaryModel: ModelConfig | null;
  secondaryModel: ModelConfig | null;
};

export type StoredProviderKeys = Partial<Record<ProviderId, string>>;

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o Mini, and more',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsCustomBaseUrl: false,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to 200+ models from various providers',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsCustomBaseUrl: false,
  },
};

export async function getProviderKeys(): Promise<StoredProviderKeys> {
  try {
    const json = await SecureStore.getItemAsync(STORAGE_KEYS.PROVIDER_KEYS);
    return json ? (JSON.parse(json) as StoredProviderKeys) : {};
  } catch (error) {
    console.error('Failed to get provider keys:', error);
    return {};
  }
}

export async function setProviderApiKey(provider: ProviderId, apiKey: string): Promise<void> {
  try {
    const keys = await getProviderKeys();
    keys[provider] = apiKey;
    await SecureStore.setItemAsync(STORAGE_KEYS.PROVIDER_KEYS, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to set provider API key:', error);
    throw error;
  }
}

export async function removeProviderApiKey(provider: ProviderId): Promise<void> {
  try {
    const keys = await getProviderKeys();
    delete keys[provider];
    await SecureStore.setItemAsync(STORAGE_KEYS.PROVIDER_KEYS, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to remove provider API key:', error);
    throw error;
  }
}

export async function getProviderApiKey(provider: ProviderId): Promise<string | null> {
  const keys = await getProviderKeys();
  return keys[provider] ?? null;
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
  const [providerKeys, primaryModel, secondaryModel] = await Promise.all([
    getProviderKeys(),
    getPrimaryModel(),
    getSecondaryModel(),
  ]);

  return {
    providerKeys: {
      openai: providerKeys.openai ?? null,
      openrouter: providerKeys.openrouter ?? null,
    },
    primaryModel,
    secondaryModel,
  };
}

export async function clearAISettings(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.PROVIDER_KEYS),
    SecureStore.deleteItemAsync(STORAGE_KEYS.PRIMARY_MODEL),
    SecureStore.deleteItemAsync(STORAGE_KEYS.SECONDARY_MODEL),
  ]);
}
