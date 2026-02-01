/**
 * AI Model Role Constants
 *
 * These constants should be used throughout the codebase whenever referencing
 * primary or secondary model selections. Do not use hard-coded strings.
 */

export const MODEL_ROLES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
} as const;

export type ModelRole = (typeof MODEL_ROLES)[keyof typeof MODEL_ROLES];
