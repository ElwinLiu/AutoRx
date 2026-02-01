import { PROVIDERS, type ProviderId, type ModelConfig } from './settings';
import { APP_NAME } from '@/constants/app';

export type FetchedModel = {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
};

export type ProviderVerificationResult = {
  valid: boolean;
  error?: string;
  models?: FetchedModel[];
};

async function verifyOpenAI(apiKey: string): Promise<ProviderVerificationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }
      const error = await response.text();
      return { valid: false, error: `OpenAI API error: ${error}` };
    }

    const data = await response.json();
    const models: FetchedModel[] = data.data
      .filter((m: { id: string }) => m.id.startsWith('gpt-'))
      .map((m: { id: string; created: number }) => ({
        id: m.id,
        name: m.id,
        description: `Created: ${new Date(m.created * 1000).toLocaleDateString()}`,
      }))
      .sort((a: FetchedModel, b: FetchedModel) => a.id.localeCompare(b.id));

    return { valid: true, models };
  } catch (error) {
    return { valid: false, error: 'Network error. Please check your connection.' };
  }
}

async function verifyOpenRouter(apiKey: string): Promise<ProviderVerificationResult> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://autorex.app',
        'X-Title': APP_NAME,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      }
      const error = await response.text();
      return { valid: false, error: `OpenRouter API error: ${error}` };
    }

    const data = await response.json();
    const models: FetchedModel[] = data.data
      .map((m: { id: string; name: string; description?: string; context_length?: number; pricing?: { prompt: number; completion: number } }) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description,
        contextWindow: m.context_length,
        pricing: m.pricing,
      }))
      .sort((a: FetchedModel, b: FetchedModel) => a.name.localeCompare(b.name));

    return { valid: true, models };
  } catch (error) {
    return { valid: false, error: 'Network error. Please check your connection.' };
  }
}

export async function verifyProviderApiKey(
  provider: ProviderId,
  apiKey: string
): Promise<ProviderVerificationResult> {
  switch (provider) {
    case 'openai':
      return verifyOpenAI(apiKey);
    case 'openrouter':
      return verifyOpenRouter(apiKey);
    default:
      return { valid: false, error: 'Unknown provider' };
  }
}

export async function fetchModelsForProvider(
  provider: ProviderId,
  apiKey: string
): Promise<FetchedModel[]> {
  const result = await verifyProviderApiKey(provider, apiKey);
  return result.models ?? [];
}

export function convertFetchedModelToConfig(
  provider: ProviderId,
  model: FetchedModel
): ModelConfig {
  return {
    provider,
    modelId: model.id,
    name: model.name,
    description: model.description,
    contextWindow: model.contextWindow,
  };
}
