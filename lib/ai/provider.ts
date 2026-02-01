import OpenAI from 'openai';

import {
  getProviderApiKey,
  getPrimaryModel,
  getSecondaryModel,
  type ModelConfig,
  PROVIDERS,
} from './settings';
import { MODEL_ROLES, type ModelRole } from './constants';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  /** @deprecated Use modelRole instead */
  useSecondaryModel?: boolean;
  /** Preferred way to specify which model to use */
  modelRole?: ModelRole;
};

export type ChatCompletionResult = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'NO_API_KEY' | 'NO_MODEL' | 'INVALID_RESPONSE' | 'API_ERROR'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

async function makeOpenAICompatibleRequest(
  apiKey: string,
  baseUrl: string,
  config: ModelConfig,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true,
  });

  try {
    const completion = await client.chat.completions.create({
      model: config.modelId,
      messages: options.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AIProviderError('Invalid response from API', 'INVALID_RESPONSE');
    }

    return {
      content,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new AIProviderError(
        `API error: ${error.status} - ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}

export async function completeChat(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const [primaryModel, secondaryModel] = await Promise.all([
    getPrimaryModel(),
    getSecondaryModel(),
  ]);

  // Determine which model role to use (prefer modelRole, fallback to useSecondaryModel)
  const modelRole = options.modelRole ?? (options.useSecondaryModel ? MODEL_ROLES.SECONDARY : MODEL_ROLES.PRIMARY);
  const modelConfig = modelRole === MODEL_ROLES.SECONDARY ? secondaryModel : primaryModel;

  if (!modelConfig) {
    throw new AIProviderError(
      `No ${modelRole} model configured. Please set up your model in settings.`,
      'NO_MODEL'
    );
  }

  const apiKey = await getProviderApiKey(modelConfig.provider);

  if (!apiKey) {
    throw new AIProviderError(
      `No API key configured for ${modelConfig.provider}. Please set up your API key in settings.`,
      'NO_API_KEY'
    );
  }

  const providerConfig = PROVIDERS[modelConfig.provider];
  const baseUrl = providerConfig.baseUrl;

  return makeOpenAICompatibleRequest(apiKey, baseUrl, modelConfig, options);
}

export async function isAIConfigured(): Promise<boolean> {
  const [primaryModel] = await Promise.all([getPrimaryModel()]);
  if (!primaryModel) return false;
  const apiKey = await getProviderApiKey(primaryModel.provider);
  return apiKey !== null;
}
