
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
  isHighlighted?: boolean;
}

export const drawMatch = ({
  ctx,
  match,
  y,
  isBIG,
  width,
  settings,
  logoCache,
  isHighlighted = false
}: DrawMatchOptions) => {
  const baseRowHeight = 72; // base height for compact layout
  const rowHeight = isHighlighted ? baseRowHeight * 2 : baseRowHeight; // double height for highlighted matches
  const verticalGap = 20; // spacing between matchboxes
  const padding = 48;
  const logoSize = 49;
  const logoTextGap = 16;

  const verticalCenter = y + verticalGap / 2 + rowHeight / 2;

  // Draw background box with border for highlighted matches
  if (isHighlighted) {
    // Draw border first (white with 0.5 opacity)
    drawRoundedRect(
      ctx,
      padding - 2, // slightly larger for border
      y + verticalGap / 2 - 2,
      width - padding * 2 + 4,
      rowHeight + 4,
      16,
      'rgba(255, 255, 255, 0.5)'
    );
  }

  // Draw main background
  drawRoundedRect(
    ctx,
    padding,
    y + verticalGap / 2,
    width - padding * 2,
    rowHeight,
    16,
    isHighlighted ? 'rgba(71, 224, 99, 0.5)' : 
    (isBIG ? 'rgba(16, 163, 127, 0.2)' : 'rgba(27, 32, 40, 0.9)')
  );

  // Time text
  if (settings.showTime) {
    ctx.font = 'bold 36px Inter';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.time, padding + 16, verticalCenter);
  }

  const timeBlockWidth = settings.showTime ? 180 : 0;
  const centerX = width / 2;

  if ('isCustomEntry' in match && match.isCustomEntry) {
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280, verticalCenter);
    return;
  }

  // Layout spacing
  const maxTextWidth = 300;
  const vsText = 'vs';
  const vsFontSize = 20;

  // --- TEAM 1
  const team1LogoX = centerX - logoSize - logoTextGap - 60;
  const team1NameX = team1LogoX - logoTextGap;

  if (settings.showLogos && match.team1.logo) {
    drawTeamLogo(
      ctx,
      match.team1.logo,
      team1LogoX,
      verticalCenter - logoSize / 2,
      logoSize,
      logoCache,
      true
    );
  }

  ctx.font = 'bold 32px Inter';
  ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const team1Name = truncateText(ctx, match.team1.name, maxTextWidth);
  ctx.fillText(team1Name, team1NameX, verticalCenter);

  // --- VS Text
  ctx.font = `${vsFontSize}px Inter`;
  ctx.fillStyle = '#6B7280';
  ctx.textAlign = 'center';
  ctx.fillText(vsText, centerX, verticalCenter);

  // --- TEAM 2
  const team2LogoX = centerX + 60 + logoTextGap;
  const team2NameX = team2LogoX + logoSize + logoTextGap;

  if (settings.showLogos && match.team2.logo) {
    drawTeamLogo(
      ctx,
      match.team2.logo,
      team2LogoX,
      verticalCenter - logoSize / 2,
      logoSize,
      logoCache,
      true
    );
  }

  ctx.font = 'bold 32px Inter';
  ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
  ctx.textAlign = 'left';
  const team2Name = truncateText(ctx, match.team2.name, maxTextWidth);
  ctx.fillText(team2Name, team2NameX, verticalCenter);

  // --- Tournament Name
  if (match.tournament) {
    ctx.font = '16px Inter';
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'right';
    ctx.fillText(match.tournament, width - padding - 16, verticalCenter);
  }

  // --- BIG Special Label
  if (isBIG && !('isCustomEntry' in match)) {
    ctx.fillStyle = '#10A37F';
    ctx.font = 'italic 30px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Anwesenheitspflicht', padding + timeBlockWidth, y + verticalGap / 2 + rowHeight + 6);
  }
};
