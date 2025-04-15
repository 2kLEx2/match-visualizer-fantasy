
import React, { useEffect, useRef, useState } from 'react';
import { Match } from '@/lib/api/matches';

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

export const CanvasMatchGraphic = ({ matches, settings, width = 600, height = 400 }: CanvasMatchGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [logoCache, setLogoCache] = useState<Record<string, HTMLImageElement>>({});

  // Pre-load all team logos to ensure they're available when drawing
  useEffect(() => {
    const teamLogos = matches
      .flatMap(match => [match.team1.logo, match.team2.logo])
      .filter(Boolean)
      .filter((url, index, self) => url && self.indexOf(url) === index); // Get unique logo URLs
    
    if (teamLogos.length === 0) {
      setImagesLoaded(true);
      return;
    }
    
    const logoElements: Record<string, HTMLImageElement> = {};
    let loadedCount = 0;
    
    teamLogos.forEach(url => {
      if (!url) return;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        logoElements[url] = img;
        loadedCount++;
        if (loadedCount === teamLogos.length) {
          console.log('All logos loaded successfully');
          setLogoCache(logoElements);
          setImagesLoaded(true);
        }
      };
      
      img.onerror = () => {
        console.log(`Failed to load logo: ${url}`);
        loadedCount++;
        if (loadedCount === teamLogos.length) {
          setLogoCache(logoElements);
          setImagesLoaded(true);
        }
      };
      
      // Default placeholder for fallback
      const placeholderUrl = 'https://picsum.photos/64/64';
      
      // Try loading the actual logo
      img.src = url;
      
      // Set a timeout to use the placeholder if actual logo doesn't load in time
      setTimeout(() => {
        if (!img.complete || img.naturalHeight === 0) {
          console.log(`Logo timed out, using placeholder: ${url}`);
          img.src = placeholderUrl;
        }
      }, 3000);
    });
    
    return () => {
      // Clean up by removing event listeners when component unmounts
      teamLogos.forEach(url => {
        if (logoElements[url]) {
          logoElements[url].onload = null;
          logoElements[url].onerror = null;
        }
      });
    };
  }, [matches]);

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
      // Draw a placeholder if the logo didn't load
      ctx.fillStyle = '#4A5568';
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    // Draw the team logo
    try {
      ctx.save();
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw the image centered in the circle
      ctx.drawImage(logoImg, x, y, size, size);
      
      // Add a subtle border
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
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
    const rowHeight = 60;
    const padding = 16;
    
    // Background
    ctx.fillStyle = isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)';
    ctx.fillRect(padding, y, width - (padding * 2), rowHeight);
    
    // Add rounded corners
    const radius = 5;
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
    
    // Vertical center position for all content
    const verticalCenter = y + (rowHeight / 2);
    
    // Time section
    if (settings.showTime) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.time, padding + 12, verticalCenter);
    }

    // Team names and logos
    const timeWidth = settings.showTime ? 70 : 0;
    const teamSection = width - timeWidth - (padding * 4);
    const centerX = timeWidth + (teamSection / 2) + padding;

    if ('isCustomEntry' in match && match.isCustomEntry) {
      // Custom entry - single title
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team1.name, centerX - 100, verticalCenter);
    } else {
      const team1TextX = centerX - 30;
      const team2TextX = centerX + 30;
      
      // Team 1 name
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team1.name, team1TextX, verticalCenter);

      // VS
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('vs', centerX, verticalCenter);

      // Team 2 name
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(match.team2.name, team2TextX, verticalCenter);

      // Draw team logos if enabled
      if (settings.showLogos) {
        // Team 1 logo (positioned to the left of the team name)
        drawLogo(ctx, match.team1.logo, team1TextX - 34, verticalCenter - 12);
        
        // Team 2 logo (positioned to the right of vs, before the team name)
        drawLogo(ctx, match.team2.logo, team2TextX + 5, verticalCenter - 12);
      }

      // Tournament name if available
      if (match.tournament) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(match.tournament, width - (padding * 2), verticalCenter);
      }
    }

    // Add BIG match indicator
    if (isBIG && !('isCustomEntry' in match)) {
      ctx.fillStyle = '#10A37F';
      ctx.font = 'italic 12px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + 10);
    }
  };

  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate required height based on matches
    const totalHeight = matches.reduce((acc, match) => {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      return acc + (isBIG ? 80 : 70); // Height for each match row
    }, 80); // Initial offset for title

    // Resize canvas if needed
    if (canvas.height < totalHeight) {
      canvas.height = totalHeight + 20; // Add some padding
    }

    // Draw title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Watchparty Schedule', width / 2, 40);

    // Draw matches
    let currentY = 80;
    for (const match of matches) {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      drawMatch(ctx, match, currentY, isBIG);
      currentY += isBIG ? 90 : 70; // Extra space for BIG matches
    }
  };

  // Draw when component mounts and when images are loaded
  useEffect(() => {
    if (imagesLoaded) {
      drawGraphic();
    }
  }, [matches, settings, imagesLoaded, logoCache]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${settings.scale / 100})`,
        transformOrigin: 'top left',
      }}
    />
  );
};
