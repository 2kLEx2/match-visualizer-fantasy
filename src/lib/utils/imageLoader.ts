
type ImageLoadResult = {
  loaded: boolean;
  loading: boolean;
};

export const loadImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
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
        const success = await loadImage(url);
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
