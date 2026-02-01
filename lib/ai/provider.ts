import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, getPrimaryModel, getSecondaryModel, type ModelConfig } from './settings';

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

async function makeOpenAIRequest(
  apiKey: string,
  config: ModelConfig,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';

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
      `OpenAI API error: ${response.status} - ${error}`,
      'API_ERROR'
    );
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new AIProviderError('Invalid response from OpenAI API', 'INVALID_RESPONSE');
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

async function makeAnthropicRequest(
  apiKey: string,
  config: ModelConfig,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const client = new Anthropic({
    apiKey,
    baseURL: config.baseUrl,
  });

  const systemMessage = options.messages.find((m) => m.role === 'system');
  const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

  try {
    const response = await client.messages.create({
      model: config.modelId,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      system: systemMessage?.content,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new AIProviderError('Unexpected response type from Anthropic API', 'INVALID_RESPONSE');
    }

    return {
      content: content.text,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new AIProviderError(
        `Anthropic API error: ${error.status} - ${error.message}`,
        'API_ERROR'
      );
    }
    throw error;
  }
}

async function makeGoogleRequest(
  apiKey: string,
  config: ModelConfig,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const baseUrl =
    config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';

  const systemMessage = options.messages.find((m) => m.role === 'system');
  const conversationMessages = options.messages.filter((m) => m.role !== 'system');

  const contents = conversationMessages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `${baseUrl}/models/${config.modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new AIProviderError(
      `Google API error: ${response.status} - ${error}`,
      'API_ERROR'
    );
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new AIProviderError('Invalid response from Google API', 'INVALID_RESPONSE');
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

async function makeCustomRequest(
  apiKey: string,
  config: ModelConfig,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  if (!config.baseUrl) {
    throw new AIProviderError(
      'Custom provider requires a baseUrl',
      'INVALID_RESPONSE'
    );
  }

  // Custom providers typically use OpenAI-compatible format
  return makeOpenAIRequest(apiKey, config, options);
}

export async function completeChat(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const [apiKey, primaryModel, secondaryModel] = await Promise.all([
    getApiKey(),
    getPrimaryModel(),
    getSecondaryModel(),
  ]);

  if (!apiKey) {
    throw new AIProviderError(
      'No API key configured. Please set up your API key in settings.',
      'NO_API_KEY'
    );
  }

  const modelConfig = options.useSecondaryModel ? secondaryModel : primaryModel;

  if (!modelConfig) {
    const modelType = options.useSecondaryModel ? 'secondary' : 'primary';
    throw new AIProviderError(
      `No ${modelType} model configured. Please set up your model in settings.`,
      'NO_MODEL'
    );
  }

  switch (modelConfig.provider) {
    case 'openai':
      return makeOpenAIRequest(apiKey, modelConfig, options);
    case 'anthropic':
      return makeAnthropicRequest(apiKey, modelConfig, options);
    case 'google':
      return makeGoogleRequest(apiKey, modelConfig, options);
    case 'custom':
      return makeCustomRequest(apiKey, modelConfig, options);
    default:
      throw new AIProviderError(
        `Unsupported provider: ${modelConfig.provider}`,
        'INVALID_RESPONSE'
      );
  }
}

export async function isAIConfigured(): Promise<boolean> {
  const [apiKey, primaryModel] = await Promise.all([
    getApiKey(),
    getPrimaryModel(),
  ]);
  return apiKey !== null && primaryModel !== null;
}
