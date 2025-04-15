
export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(width - radius, y);
  ctx.quadraticCurveTo(width, y, width, y + radius);
  ctx.lineTo(width, y + height - radius);
  ctx.quadraticCurveTo(width, y + height, width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
};

export const drawTeamLogo = (
  ctx: CanvasRenderingContext2D,
  url: string | undefined,
  x: number,
  y: number,
  size: number = 80,
  logoCache: Record<string, HTMLImageElement>
) => {
  if (!url || !logoCache[url]) return;
  
  try {
    ctx.save();
    ctx.drawImage(logoCache[url], x, y, size, size);
    ctx.restore();
  } catch (e) {
    console.error('Error drawing logo:', e);
  }
};

export const truncateText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  let truncated = text;
  const measureText = (t: string) => ctx.measureText(t).width;
  
  while (measureText(truncated) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1) + '...';
  }
  
  return truncated;
};
