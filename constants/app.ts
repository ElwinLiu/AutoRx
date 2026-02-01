/**
 * App Constants
 *
 * Centralized location for app-wide constants that should not be hardcoded
 * in multiple places throughout the codebase.
 */

export const APP_NAME = 'AutoRx' as const;

export const APP_CONFIG = {
  name: APP_NAME,
  slug: 'autorx',
  version: '1.0.0',
} as const;

export const APP_URLS = {
  support: 'https://autorx.app/support',
  privacy: 'https://autorx.app/privacy',
  terms: 'https://autorx.app/terms',
} as const;
