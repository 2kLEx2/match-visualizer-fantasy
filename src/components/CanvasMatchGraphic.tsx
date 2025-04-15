
import React, { useEffect, useRef } from 'react';
import { Match } from '@/lib/api/matches';
import { ImageOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasImages } from '@/hooks/useCanvasImages';
import { drawMatch } from './canvas/MatchDrawer';

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

export const CanvasMatchGraphic = ({ matches, settings, width = 1920, height = 1080 }: CanvasMatchGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    imagesLoaded,
    logoCache,
    bgImage,
    bgLoading,
    bgError,
    handleRetryLoading
  } = useCanvasImages(matches);

  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 32;

    const totalHeight = matches.reduce((acc, match) => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      return acc + (isBIG ? 180 : 140);
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
    ctx.font = 'bold 64px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Watchparty Schedule', width - padding - 32, 80);

    let currentY = 160;
    matches.forEach(match => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      drawMatch({
        ctx,
        match,
        y: currentY,
        isBIG,
        width,
        settings,
        logoCache
      });
      currentY += isBIG ? 180 : 140;
    });
  };

  useEffect(() => {
    if (imagesLoaded && !bgLoading) {
      console.log('Images loaded, drawing graphic');
      drawGraphic();
    }
  }, [matches, settings, imagesLoaded, logoCache, bgImage, bgLoading]);

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
