
import React, { useEffect, useRef, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { ImageOff, RefreshCw } from 'lucide-react';
import { loadImage } from '@/lib/utils/imageLoader';
import { Button } from '@/components/ui/button';

interface CanvasMatchGraphicProps {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
    scale: number;
  };
  width?: number;
  height?: number;
}

// Hardcoded fallback background in case loading fails
const FALLBACK_BG = 'linear-gradient(to right bottom, #1e293b, #0f172a)';
// Default background URL - choose a reliable one
const DEFAULT_BG_URL = 'https://images.unsplash.com/photo-1613841683751-87a67163b44c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80';

export const CanvasMatchGraphic = ({ matches, settings, width = 600, height = 400 }: CanvasMatchGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState<Record<string, HTMLImageElement>>({});
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoading, setBgLoading] = useState(true);
  const [bgError, setBgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Background image loading
  useEffect(() => {
    const bgImageUrl = DEFAULT_BG_URL;
    setBgLoading(true);
    setBgError(false);
    
    console.log('Loading background from:', bgImageUrl);
    
    const loadBackgroundImage = async () => {
      try {
        // Try direct loading first since it's a reliable source
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const loadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log('Background image loaded successfully');
            setBgImage(img);
            setBgLoading(false);
            resolve();
          };
          
          img.onerror = () => {
            console.error('Direct background load failed, trying proxy');
            reject(new Error('Direct load failed'));
          };
        });
        
        // Set the source and start loading
        img.src = bgImageUrl;
        
        try {
          // Try direct loading first with a timeout
          await Promise.race([
            loadPromise,
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
        } catch (directError) {
          console.log('Trying proxy for background...');
          // If direct loading fails, try using the proxy
          const success = await loadImage(bgImageUrl);
          
          if (success) {
            console.log('Background loaded via proxy');
            // We need to create a new image since the proxy returns a data URL
            const proxyImg = new Image();
            proxyImg.crossOrigin = "anonymous";
            proxyImg.onload = () => {
              console.log('Background image ready from proxy');
              setBgImage(proxyImg);
              setBgLoading(false);
            };
            proxyImg.onerror = () => {
              console.error('Failed to load background from proxy data URL');
              setBgLoading(false);
              setBgError(true);
            };
            proxyImg.src = bgImageUrl;
          } else {
            throw new Error('Background loading failed via proxy');
          }
        }
      } catch (error) {
        console.error('Error in background loading process:', error);
        setBgLoading(false);
        setBgError(true);
      }
    };
    
    loadBackgroundImage();
  }, [retryCount]); // Depend on retryCount to allow manual refreshing

  // Team logos loading
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
        // Use our improved loadImage utility
        const success = await loadImage(url);
        
        if (success) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          img.onload = () => {
            logoElements[url] = img;
            loadedCount++;
            checkIfComplete();
          };
          
          img.onerror = () => {
            console.log(`Failed to load logo: ${url}`);
            loadedCount++;
            checkIfComplete();
          };
          
          img.src = url;
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
  }, [matches, retryCount]); // Depend on retryCount to allow manual refreshing

  const drawLogo = (
    ctx: CanvasRenderingContext2D,
    url: string | undefined,
    x: number,
    y: number,
    size: number = 24
  ) => {
    if (!url || !settings.showLogos) return;
    
    const logoImg = logoCache[url];
    if (!logoImg) {
      ctx.fillStyle = '#4A5568';
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, x, y, size, size);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } catch (e) {
      console.error('Error drawing logo:', e);
    }
  };

  const drawMatch = (
    ctx: CanvasRenderingContext2D,
    match: Match,
    y: number,
    isBIG: boolean
  ) => {
    const rowHeight = 60;
    const padding = 16;
    
    ctx.fillStyle = isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)';
    
    const radius = 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(padding + radius, y);
    ctx.lineTo(width - padding - radius, y);
    ctx.quadraticCurveTo(width - padding, y, width - padding, y + radius);
    ctx.lineTo(width - padding, y + rowHeight - radius);
    ctx.quadraticCurveTo(width - padding, y + rowHeight, width - padding - radius, y + rowHeight);
    ctx.lineTo(padding + radius, y + rowHeight);
    ctx.quadraticCurveTo(padding, y + rowHeight, padding, y + rowHeight - radius);
    ctx.lineTo(padding, y + radius);
    ctx.quadraticCurveTo(padding, y, padding + radius, y);
    ctx.closePath();
    ctx.fillStyle = isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)';
    ctx.fill();
    ctx.restore();
    
    const verticalCenter = y + (rowHeight / 2);
    
    if (settings.showTime) {
      ctx.font = 'bold 14px Inter';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.time, padding + 12, verticalCenter);
    }

    const timeWidth = settings.showTime ? 70 : 0;
    const teamSection = width - timeWidth - (padding * 4);
    const centerX = padding + timeWidth + (teamSection / 2);

    if ('isCustomEntry' in match && match.isCustomEntry) {
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team1.name, centerX - 140, verticalCenter);
    } else {
      const team1X = centerX - 110;
      const team2X = centerX + 30;
      const vsX = centerX - 40;

      if (settings.showLogos) {
        drawLogo(ctx, match.team1.logo, team1X - 40, verticalCenter - 12);
      }
      
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team1.name, team1X, verticalCenter);

      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('vs', vsX, verticalCenter);

      if (settings.showLogos) {
        drawLogo(ctx, match.team2.logo, team2X - 40, verticalCenter - 12);
      }
      
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team2.name, team2X, verticalCenter);

      if (match.tournament) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const tournamentX = width - padding - 12;
        ctx.fillText(match.tournament, tournamentX, verticalCenter);
      }
    }

    if (isBIG && !('isCustomEntry' in match)) {
      ctx.fillStyle = '#10A37F';
      ctx.font = 'italic 12px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + 4);
    }
  };

  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 16;

    const totalHeight = matches.reduce((acc, match) => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      return acc + (isBIG ? 80 : 70);
    }, 80);

    canvas.height = totalHeight + padding;
    canvas.width = width;

    ctx.clearRect(0, 0, width, canvas.height);
    
    if (bgImage) {
      console.log('Drawing background image');
      ctx.save();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      
      const scale = Math.max(canvas.width / bgImage.width, canvas.height / bgImage.height);
      const x = (canvas.width - bgImage.width * scale) * 0.5;
      const y = (canvas.height - bgImage.height * scale) * 0.5;
      
      ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.restore();
    } else {
      console.log('Using fallback background');
      // Create a gradient background as fallback
      const gradient = ctx.createLinearGradient(0, 0, width, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, canvas.height);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Watchparty Schedule', width - padding - 12, 40);

    let currentY = 80;
    matches.forEach(match => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      drawMatch(ctx, match, currentY, isBIG);
      currentY += isBIG ? 90 : 70;
    });
  };

  useEffect(() => {
    if (imagesLoaded) {
      console.log('Images loaded, drawing graphic');
      drawGraphic();
    }
  }, [matches, settings, imagesLoaded, logoCache, bgImage]);

  const handleRetryLoading = () => {
    setBgLoading(true);
    setBgError(false);
    setImagesLoaded(false);
    setRetryCount(prev => prev + 1);
  };

  const renderFallback = () => {
    if (bgLoading) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-800 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white text-sm">Loading graphic...</p>
          </div>
        </div>
      );
    }
    
    if (bgError || !matches.length) {
      return (
        <div className="w-full h-64 flex items-center justify-center bg-gray-800 rounded-xl">
          <div className="text-center">
            <ImageOff className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-white text-sm">
              {!matches.length ? 'No matches to display' : 'Failed to load image'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRetryLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {renderFallback()}
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{
          maxWidth: '100%',
          height: 'auto',
          transform: `scale(${settings.scale / 100})`,
          transformOrigin: 'top left',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: bgLoading || bgError || !matches.length ? 'none' : 'block',
          background: FALLBACK_BG, // Added a fallback background color
        }}
      />
    </>
  );
};
