
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
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    urlParts[urlParts.length - 1] = `thumb_${fileName}`;
    return urlParts.join('/');
  } catch (error) {
    console.error('Error converting URL to thumbnail:', error);
    return url; // Return original URL if conversion fails
  }
};

/**
 * Loads an image via the Supabase proxy to handle CORS issues.
 */
export const loadImage = async (url: string): Promise<boolean> => {
  try {
    // Convert to a thumbnail version for performance benefits
    const thumbnailUrl = convertToThumbnail(url);
    console.log('Attempting to load image:', thumbnailUrl);

    // Fetch image through the Supabase proxy function
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url: thumbnailUrl }
    });

    if (error) {
      console.error('Proxy request failed:', error);
      return false;
    }

    if (!data || !data.success || !data.imageData) {
      console.error('Invalid response from proxy:', data);
      return false;
    }

    // Create an image element and load the data URL
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('Successfully loaded image:', thumbnailUrl);
        resolve(true);
      };
      img.onerror = (e) => {
        console.error('Failed to load image after proxy:', thumbnailUrl, e);
        resolve(false);
      };
      img.src = data.imageData;
    });
  } catch (fetchError) {
    console.error('Image loading error:', fetchError);
    return false;
  }
};

/**
 * Handles bulk image loading while updating state callbacks.
 */
export const useImageLoader = () => {
  const loadImages = async (
    urls: string[],
    onLoadStateChange: (url: string, state: ImageLoadResult) => void,
    onError: (message: string) => void
  ) => {
    console.log('Starting to load images:', urls);
    
    for (const url of urls) {
      if (!url) continue;
      
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
    }
  };

  return { loadImages };
};
