
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
    console.log('Attempting to load image:', thumbnailUrl);

    // Try loading through proxy first
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { url: thumbnailUrl }
    });

    if (!error && data) {
      // If proxy succeeds, try loading the image
      const img = new Image();
      return new Promise((resolve) => {
        img.onload = () => {
          console.log('Successfully loaded image:', thumbnailUrl);
          resolve(true);
        };
        img.onerror = () => {
          console.error('Failed to load image after proxy:', thumbnailUrl);
          resolve(false);
        };
        img.crossOrigin = "anonymous";
        img.src = thumbnailUrl;
      });
    } else {
      console.error('Proxy request failed:', error);
      return false;
    }
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
        console.error('Error loading image:', error);
        onLoadStateChange(url, { loaded: false, loading: false });
        onError(`Failed to load image: ${url}`);
      }
    }
  };

  return { loadImages };
};
