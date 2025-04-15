import { supabase } from '@/lib/supabase/client';

interface ImageLoadResult {
  loaded: boolean;
  loading: boolean;
}

/**
 * Converts an image URL to a thumbnail version for better performance.
 */
const convertToThumbnail = (url: string): string => {
  try {
    if (!url || typeof url !== 'string') return '';
    
    // Check if URL already contains 'thumb_'
    if (url.includes('thumb_')) return url;
    
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    urlParts[urlParts.length - 1] = `thumb_${fileName}`;
    return urlParts.join('/');
  } catch (error) {
    console.error('Error converting URL to thumbnail:', error);
    return url || ''; // Return original URL if conversion fails
  }
};

// Global caches for image loading status
const loadingCache = new Map<string, Promise<boolean>>();
const loadedImages = new Map<string, boolean>();

/**
 * Loads an image via the Supabase proxy to handle CORS issues.
 */
export const loadImage = async (url: string): Promise<boolean> => {
  try {
    // Safety check for invalid URLs
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      console.warn('Invalid image URL:', url);
      return false;
    }
    
    // Check if this image has already been loaded successfully
    if (loadedImages.has(url)) {
      return loadedImages.get(url) || false;
    }
    
    // Check if this image is already being loaded
    if (loadingCache.has(url)) {
      return loadingCache.get(url) as Promise<boolean>;
    }
    
    // Convert to a thumbnail version for performance benefits
    const thumbnailUrl = convertToThumbnail(url);
    console.log('Attempting to load image:', thumbnailUrl);

    // Create a promise for this loading operation
    const loadPromise = new Promise<boolean>(async (resolve) => {
      try {
        // Always use proxy for CDN images
        console.log('Using proxy for CDN image:', thumbnailUrl);
        await loadViaProxy(thumbnailUrl, url, resolve);
      } catch (error) {
        console.error('Image loading error:', error);
        loadedImages.set(url, false);
        resolve(false);
      }
    });
    
    // Store in cache and return
    loadingCache.set(url, loadPromise);
    
    // Clean up cache after promise resolves
    loadPromise.finally(() => {
      setTimeout(() => loadingCache.delete(url), 5000); // Remove from cache after 5 seconds
    });
    
    return loadPromise;
  } catch (fetchError) {
    console.error('Image loading error:', fetchError);
    loadedImages.set(url, false);
    return false;
  }
};

/**
 * Helper function to load an image via the proxy
 * @param thumbnailUrl The thumbnail URL to load via proxy
 * @param originalUrl The original URL to use as the cache key
 * @param resolve The promise resolver function
 */
const loadViaProxy = async (thumbnailUrl: string, originalUrl: string, resolve: (value: boolean) => void) => {
  try {
    // Check if we already have a proxied data URL for this image in the global cache
    if (window.dataUrlCache.has(originalUrl)) {
      const cachedDataUrl = window.dataUrlCache.get(originalUrl);
      if (cachedDataUrl) {
        console.log('Using cached data URL for:', originalUrl);
        loadedImages.set(originalUrl, true);
        resolve(true);
        return;
      }
    }
    
    console.log('Fetching image through proxy:', thumbnailUrl);
    
    // Fetch image through the Supabase proxy function
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url: thumbnailUrl }
    });

    if (error) {
      console.error('Proxy request failed:', error);
      loadedImages.set(originalUrl, false);
      resolve(false);
      return;
    }

    if (!data || !data.success || !data.imageData) {
      console.error('Invalid response from proxy:', data);
      loadedImages.set(originalUrl, false);
      resolve(false);
      return;
    }

    // Store in the global cache using the original URL as the key
    window.dataUrlCache.set(originalUrl, data.imageData);
    console.log('Successfully received data URL from proxy for:', thumbnailUrl);
    console.log('Cached with key:', originalUrl);

    // Create an image element and load the data URL
    const proxyImg = new Image();
    proxyImg.onload = () => {
      console.log('Successfully loaded image via proxy');
      loadedImages.set(originalUrl, true);
      resolve(true);
    };
    proxyImg.onerror = (e) => {
      console.error('Failed to load image after proxy:', e);
      loadedImages.set(originalUrl, false);
      resolve(false);
    };
    proxyImg.src = data.imageData;
  } catch (error) {
    console.error('Proxy loading error:', error);
    loadedImages.set(originalUrl, false);
    resolve(false);
  }
};

/**
 * Handles bulk image loading while updating state callbacks.
 */
export const useImageLoader = () => {
  // Track already processed URLs to prevent duplicate loading
  const processedUrls = new Set<string>();
  
  const loadImages = async (
    urls: string[],
    onLoadStateChange: (url: string, state: ImageLoadResult) => void,
    onError: (message: string) => void
  ) => {
    if (!urls || !Array.isArray(urls)) {
      console.warn('No valid URLs provided to loadImages');
      return;
    }
    
    // Filter out invalid URLs
    const validUrls = urls.filter(url => 
      url && 
      typeof url === 'string' && 
      url.startsWith('http') && 
      !processedUrls.has(url)
    );
    
    if (validUrls.length === 0) return;
    
    console.log('Starting to load images:', validUrls.length);
    
    // Mark all URLs as processed to prevent duplicate loading
    validUrls.forEach(url => processedUrls.add(url));
    
    // Load images in parallel with a concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < validUrls.length; i += concurrencyLimit) {
      chunks.push(validUrls.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (url) => {
        try {
          console.log('Loading image:', url);
          onLoadStateChange(url, { loaded: false, loading: true });
          
          const success = await loadImage(url);
          console.log('Image load result:', url, success);
          
          onLoadStateChange(url, { loaded: success, loading: false });
          
          if (!success) {
            onError(`Unable to load image: ${url}`);
          }
        } catch (error) {
          console.error('Error loading image:', error);
          onLoadStateChange(url, { loaded: false, loading: false });
          onError(`Failed to load image: ${url}`);
        }
      }));
    }
  };

  return { loadImages };
};

// Add global type definition for the dataUrlCache
declare global {
  interface Window {
    dataUrlCache: Map<string, string>;
  }
}
