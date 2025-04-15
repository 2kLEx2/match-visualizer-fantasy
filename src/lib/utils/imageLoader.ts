
import { supabase } from '@/lib/supabase/client';

type ImageLoadResult = {
  loaded: boolean;
  loading: boolean;
};

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

// Keep track of images we've already tried to load to prevent duplicate requests
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
        // Try loading directly first as an optimization
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const directLoadPromise = new Promise<boolean>((resolveImg) => {
          img.onload = () => resolveImg(true);
          img.onerror = () => resolveImg(false);
          img.src = thumbnailUrl;
        });
        
        // Set a timeout for direct loading
        const directLoadResult = await Promise.race([
          directLoadPromise,
          new Promise<boolean>(r => setTimeout(() => r(false), 2000))
        ]);
        
        if (directLoadResult) {
          console.log('Successfully loaded image directly:', thumbnailUrl);
          loadedImages.set(url, true);
          resolve(true);
          return;
        }
        
        // Direct loading failed, try proxy loading
        console.log('Direct image loading failed, trying proxy:', thumbnailUrl);
        
        // Fetch image through the Supabase proxy function
        const { data, error } = await supabase.functions.invoke('proxy-image', {
          body: { url: thumbnailUrl }
        });

        if (error) {
          console.error('Proxy request failed:', error);
          loadedImages.set(url, false);
          resolve(false);
          return;
        }

        if (!data || !data.success || !data.imageData) {
          console.error('Invalid response from proxy:', data);
          loadedImages.set(url, false);
          resolve(false);
          return;
        }

        // Create an image element and load the data URL
        const proxyImg = new Image();
        proxyImg.onload = () => {
          console.log('Successfully loaded image via proxy');
          loadedImages.set(url, true);
          resolve(true);
        };
        proxyImg.onerror = (e) => {
          console.error('Failed to load image after proxy:', e);
          loadedImages.set(url, false);
          resolve(false);
        };
        proxyImg.src = data.imageData;
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
