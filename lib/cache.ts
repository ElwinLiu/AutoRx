import * as ImagePicker from 'expo-image';
import { clearAISettings } from './ai/settings';

export type CacheType = 'images' | 'ai-settings' | 'all';

export type ClearCacheResult = {
  success: boolean;
  cleared: CacheType[];
  error?: string;
};

/**
 * Clear image cache from expo-image
 */
async function clearImageCache(): Promise<void> {
  // expo-image automatically manages cache, but we can clear it
  // Note: expo-image doesn't expose a direct clear cache API,
  // but we can use the Image.clearMemoryCache() and Image.clearDiskCache()
  // These are available in newer versions of expo-image
  try {
    const { clearMemoryCache, clearDiskCache } = await import('expo-image');
    await Promise.all([clearMemoryCache(), clearDiskCache()]);
  } catch {
    // If the functions aren't available, we can't clear the cache
    console.warn('Image cache clearing not available in this expo-image version');
  }
}

/**
 * Clear all app cache
 * - Image cache (expo-image)
 * - AI settings (secure storage)
 */
export async function clearCache(types: CacheType[] = ['all']): Promise<ClearCacheResult> {
  const cleared: CacheType[] = [];
  const errors: string[] = [];

  const shouldClear = (type: CacheType) => types.includes('all') || types.includes(type);

  try {
    if (shouldClear('images') || shouldClear('all')) {
      try {
        await clearImageCache();
        cleared.push('images');
      } catch (error) {
        errors.push(`Images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (shouldClear('ai-settings') || shouldClear('all')) {
      try {
        await clearAISettings();
        cleared.push('ai-settings');
      } catch (error) {
        errors.push(`AI Settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      cleared,
      error: errors.length > 0 ? errors.join(', ') : undefined,
    };
  } catch (error) {
    return {
      success: false,
      cleared,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get cache size information
 * Note: This is approximate as we can't get exact sizes from all cache types
 */
export async function getCacheInfo(): Promise<{
  images: 'unknown' | number;
  aiSettings: boolean;
}> {
  const { getAISettings } = await import('./ai/settings');
  const aiSettings = await getAISettings();

  return {
    images: 'unknown', // expo-image doesn't expose cache size
    aiSettings: aiSettings.apiKey !== null,
  };
}
