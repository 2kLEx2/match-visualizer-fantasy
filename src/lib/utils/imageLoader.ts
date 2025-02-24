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

    if (error || !data || !data.imageData) {
      console.error('Proxy request failed:', error);
      return false;
    }

    // Convert base64 response to a Blob and create a temporary URL
    try {
      const blob = await fetch(data.imageData).then(r => r.blob());
      const blobUrl = URL.createObjectURL(blob);

      // Load image and handle success/failure
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(blobUrl); // Cleanup
          console.log('Successfully loaded image:', thumbnailUrl);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl); // Cleanup
          console.error('Failed to load image:', thumbnailUrl);
          resolve(false);
        };
        img.src = blobUrl;
      });
    } catch (blobError) {
      console.error('Error creating blob:', blobError);
      return false;
    }
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
