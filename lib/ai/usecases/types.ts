import { type ChatCompletionOptions, type ChatCompletionResult } from '../provider';
import { type ModelRole } from '../constants';

export type { ModelRole };

/**
 * Definition of an AI use case
 */
export type AIUseCase<TInput, TOutput> = {
  /** Unique identifier for this use case */
  id: string;

  /** Human-readable description */
  description: string;

  /** Which model role to use: 'primary' or 'secondary' */
  modelRole: ModelRole;

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
