import { type ChatCompletionOptions, type ChatCompletionResult } from '../provider';

/**
 * Cost tier for AI use cases
 * - cheap: Use secondary model (fast, cost-effective)
 * - standard: Use primary model (balanced quality/cost)
 * - premium: Use primary model with higher quality settings
 */
export type CostTier = 'cheap' | 'standard' | 'premium';

/**
 * Definition of an AI use case
 */
export type AIUseCase<TInput, TOutput> = {
  /** Unique identifier for this use case */
  id: string;

  /** Human-readable description */
  description: string;

  /** Cost tier determines which model to use */
  costTier: CostTier;

  /** System prompt for this use case */
  systemPrompt: string;

  /** Build the user message from input */
  buildMessages: (input: TInput) => ChatCompletionOptions['messages'];

  /** Parse the AI response into structured output */
  parseResponse: (result: ChatCompletionResult) => TOutput;

  /** Optional: Override default temperature */
  temperature?: number;

  /** Optional: Override default max tokens */
  maxTokens?: number;
};

/**
 * Result wrapper for use case execution
 */
export type UseCaseResult<TOutput> =
  | { success: true; data: TOutput; usage?: ChatCompletionResult['usage'] }
  | { success: false; error: string };
