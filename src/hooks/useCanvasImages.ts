
import { useState, useEffect } from 'react';
import { Match } from '@/lib/api/matches';
import { loadImage } from '@/lib/utils/imageLoader';

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

  // Load team logos - only use dataUrlCache to avoid CORS issues
  useEffect(() => {
    const teamLogos = matches
      .flatMap(match => [match.team1.logo, match.team2.logo])
      .filter(Boolean)
      .filter((url, index, self) => url && self.indexOf(url) === index);
    
    if (teamLogos.length === 0) {
      setImagesLoaded(true);
      return;
    }
    
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
        
        // Call loadImage which handles the proxy logic for us
        const success = await loadImage(url);
        
        if (success) {
          // Create a new image element
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            console.log(`Successfully loaded logo: ${url}`);
            logoElements[url] = img;
            loadedCount++;
            checkIfComplete();
          };
          
          img.onerror = () => {
            console.log(`Failed to load logo: ${url}`);
            loadedCount++;
            checkIfComplete();
          };
          
          // IMPORTANT: Get the data URL from the cache - this avoids CORS issues
          const cachedDataUrl = window.dataUrlCache?.get(url);
          if (cachedDataUrl) {
            console.log(`Using cached data URL for logo: ${url}`);
            img.src = cachedDataUrl;
          } else {
            console.log(`No cached data URL found for: ${url}`);
            loadedCount++;
            checkIfComplete();
          }
        } else {
          console.log(`Failed to load logo via proxy: ${url}`);
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
      if (loadedCount === totalLogos) {
        console.log('All logos processed');
        setLogoCache(logoElements);
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
