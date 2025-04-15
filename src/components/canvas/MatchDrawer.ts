
import { Match } from '@/lib/api/matches';
import { drawRoundedRect, drawTeamLogo, truncateText } from '@/lib/utils/canvasDrawing';

interface DrawMatchOptions {
  ctx: CanvasRenderingContext2D;
  match: Match;
  y: number;
  isBIG: boolean;
  width: number;
  settings: {
    showLogos: boolean;
    showTime: boolean;
  };
  logoCache: Record<string, HTMLImageElement>;
}

export const drawMatch = ({
  ctx,
  match,
  y,
  isBIG,
  width,
  settings,
  logoCache
}: DrawMatchOptions) => {
  const rowHeight = 160;
  const padding = 48;
  
  drawRoundedRect(
    ctx,
    padding,
    y,
    width - padding,
    rowHeight,
    16,
    isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)'
  );
  
  const verticalCenter = y + (rowHeight / 2);
  
  if (settings.showTime) {
    ctx.font = 'bold 36px Inter';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.time, padding + 32, verticalCenter);
  }

  const timeWidth = settings.showTime ? 200 : 0;
  const centerX = width / 2;
  const vsX = centerX;

  if ('isCustomEntry' in match && match.isCustomEntry) {
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
  } else {
    const maxTeamNameWidth = 600;
    const team1X = centerX - 100;
    const team2X = centerX + 100;

    if (settings.showLogos) {
      // Draw team1 logo if it exists in the cache
      if (match.team1.logo && logoCache[match.team1.logo]) {
        drawTeamLogo(ctx, match.team1.logo, team1X - 280, verticalCenter - 40, 80, logoCache);
      }
    }
    
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const team1Name = truncateText(ctx, match.team1.name, maxTeamNameWidth);
    const team2Name = truncateText(ctx, match.team2.name, maxTeamNameWidth);
    
    ctx.fillText(team1Name, team1X - 100, verticalCenter);

    ctx.fillStyle = '#6B7280';
    ctx.font = '32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', vsX, verticalCenter);

    if (settings.showLogos) {
      // Draw team2 logo if it exists in the cache
      if (match.team2.logo && logoCache[match.team2.logo]) {
        drawTeamLogo(ctx, match.team2.logo, team2X + 20, verticalCenter - 40, 80, logoCache);
      }
    }
    
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(team2Name, team2X + 120, verticalCenter);

    if (match.tournament) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '32px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const tournamentX = width - padding - 32;
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
