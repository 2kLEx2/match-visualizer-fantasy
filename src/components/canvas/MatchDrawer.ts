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
    title?: string;
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
  const rowHeight = 90;
  const verticalGap = 24;
  const padding = 48;
  const logoSize = 60;
  const logoTextGap = 20;

  drawRoundedRect(
    ctx,
    padding,
    y + verticalGap/2,
    width - padding,
    rowHeight,
    16,
    isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)'
  );

  const verticalCenter = y + verticalGap/2 + (rowHeight / 2);

  if (settings.showTime) {
    ctx.font = 'bold 40px Inter';
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
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
  } else {
    const maxTeamNameWidth = 360;
    const team1X = centerX - 120;
    const team2X = centerX + 80;

    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    if (settings.showLogos && match.team1.logo) {
      drawTeamLogo(
        ctx, 
        match.team1.logo, 
        team1X - logoSize - logoTextGap,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache,
        true
      );
    }

    const team1Name = truncateText(ctx, match.team1.name, maxTeamNameWidth);
    ctx.fillText(team1Name, team1X, verticalCenter);

    ctx.fillStyle = '#6B7280';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', vsX, verticalCenter);

    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (settings.showLogos && match.team2.logo) {
      drawTeamLogo(
        ctx, 
        match.team2.logo, 
        team2X + logoTextGap,
        verticalCenter - logoSize/2, 
        logoSize, 
        logoCache,
        true
      );
    }
    
    const team2Name = truncateText(ctx, match.team2.name, maxTeamNameWidth);
    ctx.fillText(team2Name, team2X + (settings.showLogos ? logoSize + logoTextGap : 0), verticalCenter);

    if (match.tournament) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Inter';
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
