
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
  const rowHeight = 70;
  const verticalGap = 16;
  const padding = 48;
  const logoSize = 49;
  const logoTextGap = 20;
  const teamTextGap = 12;

  drawRoundedRect(
    ctx,
    padding,
    y + verticalGap / 2,
    width - padding,
    rowHeight,
    16,
    isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)'
  );

  const verticalCenter = y + verticalGap / 2 + rowHeight / 2;

  // Time
  if (settings.showTime) {
    ctx.font = 'bold 44px Inter';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.time, padding + 32, verticalCenter);
  }

  const timeWidth = settings.showTime ? 180 : 0;
  const centerX = width / 2;

  if ('isCustomEntry' in match && match.isCustomEntry) {
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
  } else {
    // Team name max width
    const maxTeamNameWidth = 300;

    const vsGap = 80;
    const team1TextX = centerX - vsGap;
    const team2TextX = centerX + vsGap;

    // Team 1
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    if (settings.showLogos && match.team1.logo) {
      drawTeamLogo(
        ctx,
        match.team1.logo,
        team1TextX - logoSize - logoTextGap,
        verticalCenter - logoSize / 2,
        logoSize,
        logoCache,
        true
      );
    }

    const team1Name = truncateText(ctx, match.team1.name, maxTeamNameWidth);
    ctx.fillText(team1Name, team1TextX, verticalCenter);

    // VS
    ctx.fillStyle = '#6B7280';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', centerX, verticalCenter);

    // Team 2
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (settings.showLogos && match.team2.logo) {
      drawTeamLogo(
        ctx,
        match.team2.logo,
        team2TextX + logoTextGap,
        verticalCenter - logoSize / 2,
        logoSize,
        logoCache,
        true
      );
    }

    const team2Name = truncateText(ctx, match.team2.name, maxTeamNameWidth);
    ctx.fillText(team2Name, team2TextX + (settings.showLogos ? logoSize + logoTextGap : 0), verticalCenter);

    // Tournament
    if (match.tournament) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const tournamentX = width - padding - 32;
      ctx.fillText(match.tournament, tournamentX, verticalCenter);
    }
  }

  // BIG footer note
  if (isBIG && !('isCustomEntry' in match)) {
    ctx.fillStyle = '#10A37F';
    ctx.font = 'italic 24px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Anwesenheitspflicht', timeWidth + padding, y + rowHeight + verticalGap / 2 + 8);
  }
};

