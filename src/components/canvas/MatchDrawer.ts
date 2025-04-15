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
  // Reduce row height from 160 to 120 for more compact layout
  const rowHeight = 120;
  const padding = 48;
  const logoSize = 48; // Reduced from 80
  
  // Draw background
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
  
  // Draw time (left side)
  if (settings.showTime) {
    ctx.font = 'bold 42px Inter'; // Slightly larger time font
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.time, padding + 32, verticalCenter);
  }

  const timeWidth = settings.showTime ? 180 : 0;
  const centerX = width / 2;
  const vsX = centerX;

  if ('isCustomEntry' in match && match.isCustomEntry) {
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
  } else {
    const maxTeamNameWidth = 400; // Reduced for better spacing
    const team1X = centerX - 80; // Adjusted position
    const team2X = centerX + 80;
    const logoGap = 16; // Gap between logo and team name

    // Team 1 (Right aligned, before vs)
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const team1Name = truncateText(ctx, match.team1.name, maxTeamNameWidth);
    ctx.fillText(team1Name, team1X - (settings.showLogos ? logoSize + logoGap : 0), verticalCenter);

    // Draw Team 1 logo
    if (settings.showLogos && match.team1.logo) {
      drawTeamLogo(
        ctx, 
        match.team1.logo, 
        team1X - logoSize - 8,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache
      );
    }

    // VS text (centered)
    ctx.fillStyle = '#6B7280';
    ctx.font = '32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', vsX, verticalCenter);

    // Team 2 (Left aligned, after vs)
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const team2Name = truncateText(ctx, match.team2.name, maxTeamNameWidth);
    ctx.fillText(team2Name, team2X + (settings.showLogos ? logoGap : 0), verticalCenter);

    // Draw Team 2 logo
    if (settings.showLogos && match.team2.logo) {
      drawTeamLogo(
        ctx, 
        match.team2.logo, 
        team2X + ctx.measureText(team2Name).width + logoGap,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache
      );
    }

    // Tournament name (far right)
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
