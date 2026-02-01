import {
  getProviderApiKey,
  getPrimaryModel,
  getSecondaryModel,
  type ModelConfig,
  type ProviderId,
  PROVIDERS,
} from './settings';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  useSecondaryModel?: boolean;
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
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AIProviderError(
      `API error: ${response.status} - ${error}`,
      'API_ERROR'
    );
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new AIProviderError('Invalid response from API', 'INVALID_RESPONSE');
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

export async function completeChat(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const [primaryModel, secondaryModel] = await Promise.all([
    getPrimaryModel(),
    getSecondaryModel(),
  ]);

  const modelConfig = options.useSecondaryModel ? secondaryModel : primaryModel;

  if (!modelConfig) {
    const modelType = options.useSecondaryModel ? 'secondary' : 'primary';
    throw new AIProviderError(
      `No ${modelType} model configured. Please set up your model in settings.`,
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
