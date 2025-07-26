import { useState, useEffect } from 'react';
import type { Match } from '../types';
import { ImageLoader } from '../CanvasBuildSystem';

// Declare global cache
declare global {
  var dataUrlCache: Map<string, string> | undefined;
}

// Ensure dataUrlCache exists globally
if (typeof window !== 'undefined' && !globalThis.dataUrlCache) {
  console.log('Initializing global dataUrlCache from useCanvasImages');
  globalThis.dataUrlCache = new Map<string, string>();
}

export const useCanvasImages = (matches: Match[], backgroundImageUrl?: string) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState<Record<string, HTMLImageElement>>({});
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoading, setBgLoading] = useState(!!backgroundImageUrl);
  const [bgError, setBgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load background image
  useEffect(() => {
    if (!backgroundImageUrl) {
      setBgLoading(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImageUrl;

    img.onload = () => {
      console.log('Background image loaded successfully');
      setBgImage(img);
      setBgLoading(false);
    };
    
    img.onerror = () => {
      console.error('Failed to load background');
      setBgLoading(false);
      setBgError(true);
    };
  }, [backgroundImageUrl, retryCount]);

  // Load team logos using the ImageLoader from CanvasBuildSystem
  useEffect(() => {
    const loadLogos = async () => {
      // Extract all logo URLs
      const logoUrls = matches
        .flatMap(match => [match.team1.logo, match.team2.logo])
        .filter((url): url is string => Boolean(url));

      if (logoUrls.length === 0) {
        setImagesLoaded(true);
        return;
      }

      try {
        console.log('Loading logos via ImageLoader:', logoUrls);
        const cache = await ImageLoader.loadImages(logoUrls);
        setLogoCache(cache);
        setImagesLoaded(true);
        console.log('All logos loaded successfully');
      } catch (error) {
        console.error('Error loading logos:', error);
        setImagesLoaded(true); // Still set to true to prevent infinite loading
      }
    };

    loadLogos();
  }, [matches, retryCount]);

  const handleRetryLoading = () => {
    console.log('Retrying image loading');
    setBgLoading(!!backgroundImageUrl);
    setBgError(false);
    setImagesLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  return {
    imagesLoaded,
    logoCache,
    bgImage,
    bgLoading,
    bgError,
    handleRetryLoading
  };
};