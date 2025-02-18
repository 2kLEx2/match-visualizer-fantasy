
import { supabase } from '@/lib/supabase/client';

type ImageLoadResult = {
  loaded: boolean;
  loading: boolean;
};

export const loadImage = async (url: string): Promise<boolean> => {
  try {
    // First try loading the image directly
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = async () => {
        try {
          // If direct loading fails, try using the proxy
          const { data, error } = await supabase.functions.invoke('proxy-image', {
            body: { url }
          });
          
          if (error) {
            console.error('Proxy error:', error);
            resolve(false);
            return;
          }

          // Create a new image with the proxied data
          const proxiedImg = new Image();
          proxiedImg.onload = () => resolve(true);
          proxiedImg.onerror = () => resolve(false);
          proxiedImg.src = data.url || url;
        } catch (proxyError) {
          console.error('Proxy attempt failed:', proxyError);
          resolve(false);
        }
      };
      img.src = url;
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
        console.log('Loading image:', url);
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
