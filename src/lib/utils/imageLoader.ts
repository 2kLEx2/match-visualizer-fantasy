
import { supabase } from '@/lib/supabase/client';

type ImageLoadResult = {
  loaded: boolean;
  loading: boolean;
};

const convertToThumbnail = (url: string): string => {
  try {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    // Replace the last part of the URL with the thumbnail version
    urlParts[urlParts.length - 1] = `thumb_${fileName}`;
    return urlParts.join('/');
  } catch (error) {
    console.error('Error converting URL to thumbnail:', error);
    return url; // Return original URL if conversion fails
  }
};

export const loadImage = async (url: string): Promise<boolean> => {
  try {
    // Convert to thumbnail version for better performance
    const thumbnailUrl = convertToThumbnail(url);
    console.log('Loading thumbnail:', thumbnailUrl);

    // First try loading the image directly
    const img = new Image();
    const directLoadPromise = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.crossOrigin = "anonymous";
      img.src = thumbnailUrl;
    });

    const directResult = await directLoadPromise;
    if (directResult) return true;
    
    // If direct loading fails, try using the proxy silently
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url: thumbnailUrl }
    });

    if (error || !data?.success) {
      console.error('Failed to load image through proxy:', thumbnailUrl);
      return false;
    }

    // Try loading the image again with CORS proxy
    const proxiedImg = new Image();
    return new Promise((resolve) => {
      proxiedImg.onload = () => resolve(true);
      proxiedImg.onerror = () => {
        console.error('Failed to load proxied image:', thumbnailUrl);
        resolve(false);
      };
      proxiedImg.crossOrigin = "anonymous";
      proxiedImg.src = thumbnailUrl;
    });
  } catch (error) {
    console.error('Image loading error:', error);
    return false;
  }
};

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
        console.error('Error loading image:', url, error);
        onLoadStateChange(url, { loaded: false, loading: false });
        onError(`Failed to load image: ${url}`);
      }
    }
  };

  return { loadImages };
};
