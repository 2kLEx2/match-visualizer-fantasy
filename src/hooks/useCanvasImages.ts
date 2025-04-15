
import { useState, useEffect } from 'react';
import { Match } from '@/lib/api/matches';
import { loadImage } from '@/lib/utils/imageLoader';

// Ensure dataUrlCache exists globally
if (typeof window !== 'undefined' && !window.dataUrlCache) {
  console.log('Initializing global dataUrlCache from useCanvasImages');
  window.dataUrlCache = new Map<string, string>();
}

export const useCanvasImages = (matches: Match[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState<Record<string, HTMLImageElement>>({});
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoading, setBgLoading] = useState(true);
  const [bgError, setBgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load background image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/lovable-uploads/22f955af-b708-4ec0-b29d-ed039808702f.png";

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
  }, [retryCount]);

  // Load team logos
  useEffect(() => {
    // Initialize dataUrlCache if it doesn't exist
    if (typeof window !== 'undefined' && !window.dataUrlCache) {
      console.log('Initializing dataUrlCache inside logo loading effect');
      window.dataUrlCache = new Map<string, string>();
    }
    
    const teamLogos = matches
      .flatMap(match => [match.team1.logo, match.team2.logo])
      .filter(Boolean)
      .filter((url, index, self) => url && self.indexOf(url) === index);
    
    if (teamLogos.length === 0) {
      setImagesLoaded(true);
      return;
    }
    
    console.log('Starting to load team logos:', teamLogos);
    const logoElements: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    const totalLogos = teamLogos.length;
    
    teamLogos.forEach(async (url) => {
      if (!url) {
        loadedCount++;
        checkIfComplete();
        return;
      }
      
      try {
        console.log(`Loading team logo via proxy: ${url}`);
        
        // First, try to load the image through the proxy
        const success = await loadImage(url);
        
        if (success) {
          console.log(`Successfully loaded logo via proxy: ${url}`);
          
          // Create a new image element for the cached data URL
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            console.log(`Successfully loaded logo img element: ${url}`);
            logoElements[url] = img;
            loadedCount++;
            checkIfComplete();
          };
          
          img.onerror = () => {
            console.error(`Failed to load logo img element: ${url}`);
            loadedCount++;
            checkIfComplete();
          };
          
          // Get the cached data URL from the global cache
          if (window.dataUrlCache && window.dataUrlCache.has(url)) {
            const cachedDataUrl = window.dataUrlCache.get(url);
            if (cachedDataUrl) {
              console.log(`Using cached data URL for logo: ${url}`);
              img.src = cachedDataUrl;
            } else {
              console.error(`No cached data URL found for: ${url}`);
              loadedCount++;
              checkIfComplete();
            }
          } else {
            console.error(`URL not found in cache: ${url}`);
            loadedCount++;
            checkIfComplete();
          }
        } else {
          console.error(`Failed to load logo via proxy: ${url}`);
          loadedCount++;
          checkIfComplete();
        }
      } catch (error) {
        console.error(`Error loading logo ${url}:`, error);
        loadedCount++;
        checkIfComplete();
      }
    });
    
    function checkIfComplete() {
      console.log(`Loaded ${loadedCount}/${totalLogos} logos`);
      if (loadedCount === totalLogos) {
        // Log the actual keys to debug the issue
        console.log('All logos processed:', logoElements);
        
        // Only update the state if we actually have logos
        if (Object.keys(logoElements).length > 0) {
          setLogoCache(prevCache => ({...prevCache, ...logoElements}));
        } else {
          console.warn('No logos were successfully loaded into the cache');
        }
        
        setImagesLoaded(true);
      }
    }
  }, [matches, retryCount]);

  const handleRetryLoading = () => {
    console.log('Retrying image loading');
    setBgLoading(true);
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
