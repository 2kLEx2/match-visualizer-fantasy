
import { supabase } from '@/lib/supabase/client';

type ImageLoadResult = {
  loaded: boolean;
  loading: boolean;
};

export const loadImage = async (url: string): Promise<boolean> => {
  try {
    // First try loading the image directly
    const img = new Image();
    const directLoadPromise = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.crossOrigin = "anonymous";
      img.src = url;
    });

    const directResult = await directLoadPromise;
    if (directResult) return true;
    
    // If direct loading fails, try using the proxy silently
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url }
    });

    if (error || !data?.success) {
      console.error('Failed to load image through proxy:', url);
      return false;
    }

    // Try loading the image again with CORS proxy
    const proxiedImg = new Image();
    return new Promise((resolve) => {
      proxiedImg.onload = () => resolve(true);
      proxiedImg.onerror = () => {
        console.error('Failed to load proxied image:', url);
        resolve(false);
      };
      proxiedImg.crossOrigin = "anonymous";
      proxiedImg.src = url;
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
