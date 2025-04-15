import React, { useEffect, useRef, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { ImageOff, RefreshCw } from 'lucide-react';
import { loadImage } from '@/lib/utils/imageLoader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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

const FALLBACK_BG = 'linear-gradient(to right bottom, #1e293b, #0f172a)';

export const CanvasMatchGraphic = ({ matches, settings, width = 1200, height = 800 }: CanvasMatchGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState<Record<string, HTMLImageElement>>({});
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgLoading, setBgLoading] = useState(true);
  const [bgError, setBgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

          const dataUrlCache = new Map<string, string>();
          const cachedUrl = dataUrlCache.get(url);
          
          if (cachedUrl) {
            img.src = cachedUrl;
          } else {
            if (url.includes('pandascore.co') || url.includes('cdn.')) {
              try {
                const { data } = await supabase.functions.invoke('proxy-image', {
                  body: { url }
                });
                
                if (data?.success && data?.imageData) {
                  dataUrlCache.set(url, data.imageData);
                  img.src = data.imageData;
                } else {
                  img.src = url;
                }
              } catch (e) {
                img.src = url;
              }
            } else {
              img.src = url;
            }
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

  const drawLogo = (
    ctx: CanvasRenderingContext2D,
    url: string | undefined,
    x: number,
    y: number,
    size: number = 48
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
      ctx.drawImage(logoImg, x, y, size, size);
      ctx.restore();
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
    const rowHeight = 120;
    const padding = 32;
    
    ctx.fillStyle = isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)';
    
    const radius = 16;
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
      ctx.font = 'bold 28px Inter';
      ctx.fillStyle = '#9CA3AF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.time, padding + 24, verticalCenter);
    }

    const timeWidth = settings.showTime ? 140 : 0;
    const teamSection = width - timeWidth - (padding * 4);
    const centerX = padding + timeWidth + (teamSection / 2);

    if ('isCustomEntry' in match && match.isCustomEntry) {
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 28px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
    } else {
      const maxTeamNameWidth = 300;
      const team1X = centerX - 220;
      const team2X = centerX + 60;
      const vsX = centerX - 80;

      if (settings.showLogos) {
        drawLogo(ctx, match.team1.logo, team1X - 80, verticalCenter - 24, 48);
      }
      
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 28px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      let team1Name = match.team1.name;
      let team2Name = match.team2.name;
      
      const measureText = (text: string) => {
        const metrics = ctx.measureText(text);
        return metrics.width;
      };
      
      while (measureText(team1Name) > maxTeamNameWidth && team1Name.length > 0) {
        team1Name = team1Name.slice(0, -1) + '...';
      }
      
      while (measureText(team2Name) > maxTeamNameWidth && team2Name.length > 0) {
        team2Name = team2Name.slice(0, -1) + '...';
      }
      
      ctx.fillText(team1Name, team1X, verticalCenter);

      ctx.fillStyle = '#6B7280';
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('vs', vsX, verticalCenter);

      if (settings.showLogos) {
        drawLogo(ctx, match.team2.logo, team2X - 80, verticalCenter - 24, 48);
      }
      
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = 'bold 28px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(team2Name, team2X, verticalCenter);

      if (match.tournament) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '24px Inter';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const tournamentX = width - padding - 24;
        ctx.fillText(match.tournament, tournamentX, verticalCenter);
      }
    }

    if (isBIG && !('isCustomEntry' in match)) {
      ctx.fillStyle = '#10A37F';
      ctx.font = 'italic 24px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + 8);
    }
  };

  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 32;

    const totalHeight = matches.reduce((acc, match) => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      return acc + (isBIG ? 160 : 140);
    }, 160);

    canvas.height = totalHeight;
    canvas.width = width;

    ctx.clearRect(0, 0, width, canvas.height);
    
    if (bgImage) {
      ctx.save();
      
      const scale = Math.max(canvas.width / bgImage.width, 1);
      const scaledWidth = bgImage.width * scale;
      const scaledHeight = bgImage.height * scale;
      
      ctx.drawImage(bgImage, 0, 0, scaledWidth, scaledHeight);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.restore();
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, canvas.height);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Watchparty Schedule', width - padding - 24, 80);

    let currentY = 160;
    matches.forEach(match => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      drawMatch(ctx, match, currentY, isBIG);
      currentY += isBIG ? 180 : 140;
    });
  };

  useEffect(() => {
    if (imagesLoaded && !bgLoading) {
      console.log('Images loaded, drawing graphic');
      drawGraphic();
    }
  }, [matches, settings, imagesLoaded, logoCache, bgImage, bgLoading]);

  const handleRetryLoading = () => {
    console.log('Retrying image loading');
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
          background: FALLBACK_BG,
        }}
      />
    </>
  );
};
