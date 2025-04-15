
import React, { useEffect, useRef } from 'react';
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
    
    // Time
    if (settings.showTime) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(match.time, padding + 12, y + 35);
    }

    // Team names
    const timeWidth = settings.showTime ? 70 : 0;
    const teamSection = width - timeWidth - (padding * 4);
    const centerX = timeWidth + (teamSection / 2) + padding;

    if ('isCustomEntry' in match && match.isCustomEntry) {
      // Custom entry - single title
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(match.team1.name, centerX - 100, y + 35);
    } else {
      // Regular match with two teams
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.font = '14px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(match.team1.name, centerX - 20, y + 35);

      // VS
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('vs', centerX, y + 35);

      // Team 2
      ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(match.team2.name, centerX + 20, y + 35);

      // Tournament name if available
      if (match.tournament) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(match.tournament, width - (padding * 2), y + 35);
      }
    }

    // Add BIG match indicator
    if (isBIG && !('isCustomEntry' in match)) {
      ctx.fillStyle = '#10A37F';
      ctx.font = 'italic 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + 16);
    }
  };

  const drawGraphic = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Watchparty Schedule', width - 24, 40);

    // Draw matches
    let currentY = 80;
    for (const match of matches) {
      const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";
      drawMatch(ctx, match, currentY, isBIG);
      currentY += isBIG ? 90 : 70; // Extra space for BIG matches
    }
  };

  useEffect(() => {
    drawGraphic();
  }, [matches, settings]);

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
