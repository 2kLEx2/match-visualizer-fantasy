
import React, { useEffect, useRef } from 'react';
import { Match } from '@/lib/api/matches';
import { ImageOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasImages } from '@/hooks/useCanvasImages';
import { drawMatch } from './canvas/MatchDrawer';

// Ensure dataUrlCache exists globally
if (typeof window !== 'undefined' && !window.dataUrlCache) {
  console.log('Initializing global dataUrlCache from CanvasMatchGraphic');
  window.dataUrlCache = new Map<string, string>();
}

interface CanvasMatchGraphicProps {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
    scale: number;
    title: string;
    highlightedMatchId?: string | null;
  };
  width?: number;
  height?: number;
}

const FALLBACK_BG = 'linear-gradient(to right bottom, #1e293b, #0f172a)';

export const CanvasMatchGraphic = ({ matches, settings, width = 1200, height = 675 }: CanvasMatchGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    imagesLoaded,
    logoCache,
    bgImage,
    bgLoading,
    bgError,
    handleRetryLoading
  } = useCanvasImages(matches);

  useEffect(() => {
    // Log the logoCache to check if data URLs are being added correctly
    if (matches.some(match => match.team1.logo?.startsWith('data:') || match.team2.logo?.startsWith('data:'))) {
      console.log('Custom match logos detected, logoCache keys:', Object.keys(logoCache).length);
    }
  }, [matches, logoCache]);

  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 24;

    // Calculate total height based on matches, accounting for highlighted match
    let totalHeight = 140; // Initial height for title section
    let currentY = 140;
    
    matches.forEach(match => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      const isHighlighted = settings.highlightedMatchId === match.id;
      
      // Base row height without spacing
      const baseRowHeight = 72; 
      // Double height for highlighted matches
      const rowHeight = isHighlighted ? baseRowHeight * 2 : baseRowHeight;
      
      // Add vertical spacing
      const verticalGap = 20;
      
      // Add this match's height to the total
      totalHeight += rowHeight + verticalGap;
    });

    // Set exact canvas dimensions - this is important for the download
    canvas.height = totalHeight + padding;
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
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(settings.title, width - padding - 24, 70);

    console.log('Drawing matches with logoCache keys:', Object.keys(logoCache).length);
    
    // Reset for drawing matches
    currentY = 140;
    
    // Draw each match with proper spacing
    matches.forEach(match => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      const isHighlighted = settings.highlightedMatchId === match.id;
      
      drawMatch({
        ctx,
        match,
        y: currentY,
        isBIG,
        width,
        settings,
        logoCache,
        isHighlighted
      });
      
      // Advance Y position - needs to account for highlighted matches taking more space
      const baseRowHeight = 72;
      const rowHeight = isHighlighted ? baseRowHeight * 2 : baseRowHeight;
      const verticalGap = 20;
      
      // For BIG matches, we add extra space for "Anwesenheitspflicht" text
      const bigMatchExtraSpace = isBIG ? 20 : 0;
      
      // Update the current Y position for the next match
      currentY += rowHeight + verticalGap + bigMatchExtraSpace;
    });
  };

  useEffect(() => {
    if (imagesLoaded && !bgLoading) {
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
        data-graphic-canvas="true"
      />
    </>
  );
};
