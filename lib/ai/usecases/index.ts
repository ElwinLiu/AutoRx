import { completeChat, type ChatCompletionResult } from '../provider';
import { type AIUseCase, type UseCaseResult, type CostTier } from './types';

/**
 * Execute an AI use case
 * Automatically selects the appropriate model based on cost tier
 */
export async function executeUseCase<TInput, TOutput>(
  useCase: AIUseCase<TInput, TOutput>,
  input: TInput
): Promise<UseCaseResult<TOutput>> {
  try {
    const messages = useCase.buildMessages(input);

    const result = await completeChat({
      messages: [{ role: 'system', content: useCase.systemPrompt }, ...messages],
      temperature: useCase.temperature,
      maxTokens: useCase.maxTokens,
      useSecondaryModel: useCase.costTier === 'cheap',
    });

    const data = useCase.parseResponse(result);

    return {
      success: true,
      data,
      usage: result.usage,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new use case with type safety
 */
export function defineUseCase<TInput, TOutput>(
  definition: AIUseCase<TInput, TOutput>
): AIUseCase<TInput, TOutput> {
  return definition;
}

export * from './types';
