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
  // Adjust row height and add more vertical spacing between matches
  const rowHeight = 90; // Reduced from 120 for better proportions
  const verticalGap = 24; // Add space between match boxes
  const padding = 48;
  const logoSize = 40; // Slightly smaller logos
  const logoTextGap = 60; // INCREASED gap between logo and text (from 40 to 60)
  
  // Draw background with adjusted y position to account for gaps
  drawRoundedRect(
    ctx,
    padding,
    y + verticalGap/2, // Add half the gap at the top
    width - padding,
    rowHeight,
    16,
    isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)'
  );
  
  const verticalCenter = y + verticalGap/2 + (rowHeight / 2);
  
  // Draw time (left side)
  if (settings.showTime) {
    ctx.font = 'bold 42px Inter';
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
    const maxTeamNameWidth = 360; // Slightly reduced to accommodate more spacing
    const team1X = centerX - 100; // Adjusted positions for better spacing
    const team2X = centerX + 100;

    // Team 1 (Right aligned, before vs)
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Draw Team 1 logo 
    if (settings.showLogos && match.team1.logo) {
      drawTeamLogo(
        ctx, 
        match.team1.logo, 
        team1X - logoSize,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache
      );
    }

    const team1Name = truncateText(ctx, match.team1.name, maxTeamNameWidth);
    ctx.fillText(team1Name, team1X - (settings.showLogos ? logoSize + logoTextGap : 0), verticalCenter);

    // VS text (centered)
    ctx.fillStyle = '#6B7280';
    ctx.font = '32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', vsX, verticalCenter);

    // Team 2 (Left aligned, after vs) - NOW with logo BEFORE name
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 36px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Draw Team 2 logo FIRST (before the name)
    if (settings.showLogos && match.team2.logo) {
      drawTeamLogo(
        ctx, 
        match.team2.logo, 
        team2X,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache
      );
    }
    
    const team2Name = truncateText(ctx, match.team2.name, maxTeamNameWidth);
    ctx.fillText(team2Name, team2X + (settings.showLogos ? logoSize + logoTextGap : 0), verticalCenter);

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
    ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + verticalGap/2 + 8);
  }
};
