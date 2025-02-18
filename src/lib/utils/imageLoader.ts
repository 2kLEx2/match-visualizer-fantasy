
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
      img.src = url;
    });

    const directResult = await directLoadPromise;
    if (directResult) return true;

    // If direct loading fails, try using the proxy
    console.log('Direct image load failed, trying proxy:', url);
    
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url }
    });

    if (error) {
      console.error('Proxy error:', error);
      return false;
    }

    if (!data) {
      console.error('No data returned from proxy');
      return false;
    }

    // Try loading the proxied image
    const proxiedImg = new Image();
    return new Promise((resolve) => {
      proxiedImg.onload = () => resolve(true);
      proxiedImg.onerror = () => {
        console.error('Failed to load proxied image');
        resolve(false);
      };
      proxiedImg.src = data.url || url;
    });
  } catch (error) {
    console.error('Image loading error:', error);
    return false;
  }
};

export const useImageLoader = () => {
  const loadImages = async (
    urls: (string | undefined)[],
    onLoadStateChange: (url: string, state: ImageLoadResult) => void,
    onError: (message: string) => void
  ) => {
    for (const url of urls) {
      if (!url) continue;
      
      try {
        onLoadStateChange(url, { loaded: false, loading: true });
        console.log('Starting image load:', url);
        
        const success = await loadImage(url);
        console.log('Image load result:', url, success);
        
        onLoadStateChange(url, { loaded: success, loading: false });
        
        if (!success) {
          onError(`Unable to load image: ${url}`);
        }
      } catch (error) {
        console.error('Error in image loading process:', error);
        onLoadStateChange(url, { loaded: false, loading: false });
        onError(`Failed to load image: ${url}`);
      }
    }
  };

  return { loadImages };
};
