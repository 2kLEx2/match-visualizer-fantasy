
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
    totalSelectedMatches?: number;
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
  // Determine if we should scale up matches (1-2 selected matches only)
  const shouldScaleUpMatches = settings.totalSelectedMatches && settings.totalSelectedMatches <= 2;
  const scaleFactor = shouldScaleUpMatches ? 1.8 : 1;
  
  const baseRowHeight = 72; // base height for compact layout
  const rowHeight = isHighlighted ? baseRowHeight * 2 * scaleFactor : baseRowHeight * scaleFactor;
  const verticalGap = 20 * scaleFactor; // spacing between matchboxes
  const padding = 48;
  const logoSize = 49 * scaleFactor;
  const logoTextGap = 16 * scaleFactor;
  const borderWidth = 4 * scaleFactor; // increased border width

  const verticalCenter = y + verticalGap / 2 + rowHeight / 2;

  // Draw background box with border for highlighted matches
  if (isHighlighted) {
    // Draw border first (white with 0.5 opacity)
    drawRoundedRect(
      ctx,
      padding - borderWidth, // adjusted for larger border
      y + verticalGap / 2 - borderWidth,
      width - padding * 2 + (borderWidth * 2),
      rowHeight + (borderWidth * 2),
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
    ctx.font = `bold ${Math.round(36 * scaleFactor)}px Inter`;
    ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#9CA3AF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.time, padding + 16 * scaleFactor, verticalCenter);
  }

  const timeBlockWidth = settings.showTime ? 180 * scaleFactor : 0;
  const centerX = width / 2;

  if ('isCustomEntry' in match && match.isCustomEntry) {
    ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
    ctx.font = `bold ${Math.round(32 * scaleFactor)}px Inter`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(match.team1.name, centerX - 280 * scaleFactor, verticalCenter);
    return;
  }

  // Layout spacing
  const maxTextWidth = 300 * scaleFactor;
  const vsText = 'vs';
  const vsFontSize = 20 * scaleFactor;

  // --- TEAM 1
  const team1LogoX = centerX - logoSize - logoTextGap - 60 * scaleFactor;
  const team1NameX = team1LogoX - logoTextGap;

  if (settings.showLogos && match.team1.logo) {
    // Log to debug
    const isDataUrl = match.team1.logo.startsWith('data:');
    console.log(`Drawing team1 logo: ${isDataUrl ? 'Data URL' : match.team1.logo.substring(0, 20)}...`);
    
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

  ctx.font = `bold ${Math.round(32 * scaleFactor)}px Inter`;
  ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const team1Name = truncateText(ctx, match.team1.name, maxTextWidth);
  ctx.fillText(team1Name, team1NameX, verticalCenter);

  // --- VS Text
  ctx.font = `${Math.round(vsFontSize)}px Inter`;
  ctx.fillStyle = '#6B7280';
  ctx.textAlign = 'center';
  ctx.fillText(vsText, centerX, verticalCenter);

  // --- TEAM 2
  const team2LogoX = centerX + 60 * scaleFactor + logoTextGap;
  const team2NameX = team2LogoX + logoSize + logoTextGap;

  if (settings.showLogos && match.team2.logo) {
    // Log to debug
    const isDataUrl = match.team2.logo.startsWith('data:');
    console.log(`Drawing team2 logo: ${isDataUrl ? 'Data URL' : match.team2.logo.substring(0, 20)}...`);
    
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

  ctx.font = `bold ${Math.round(32 * scaleFactor)}px Inter`;
  ctx.fillStyle = isBIG ? '#10A37F' : '#FFFFFF';
  ctx.textAlign = 'left';
  const team2Name = truncateText(ctx, match.team2.name, maxTextWidth);
  ctx.fillText(team2Name, team2NameX, verticalCenter);

  // --- Tournament Name
  if (match.tournament) {
    ctx.font = `${Math.round(16 * scaleFactor)}px Inter`;
    ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#6B7280';
    ctx.textAlign = 'right';
    ctx.fillText(match.tournament, width - padding - 16 * scaleFactor, verticalCenter);
  }

  // --- BIG Special Label
  if (isBIG && !('isCustomEntry' in match)) {
    ctx.fillStyle = '#10A37F';
    ctx.font = `italic ${Math.round(30 * scaleFactor)}px Inter`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const labelY = isHighlighted ? y + verticalGap / 2 + rowHeight + 12 * scaleFactor : y + verticalGap / 2 + rowHeight + 6 * scaleFactor;
    ctx.fillText('Anwesenheitspflicht', padding + timeBlockWidth, labelY);
  }
};

