
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
  if (!url) {
    drawFallbackLogo(ctx, x, y, size);
    return;
  }
  
  // First try to use the logo from the cache
  if (logoCache[url]) {
    try {
      console.log(`Drawing logo from cache: ${url} at position (${x}, ${y})`);
      ctx.save();
      ctx.drawImage(logoCache[url], x, y, size, size);
      ctx.restore();
      return;
    } catch (e) {
      console.error('Error drawing logo from cache:', e);
    }
  }
  
  // If not in logoCache, try to use the global dataUrlCache as fallback
  if (typeof window !== 'undefined' && window.dataUrlCache && window.dataUrlCache.has(url)) {
    try {
      console.log(`Drawing logo from global dataUrlCache: ${url}`);
      const dataUrl = window.dataUrlCache.get(url);
      if (dataUrl) {
        const tempImg = new Image();
        tempImg.onload = () => {
          ctx.save();
          ctx.drawImage(tempImg, x, y, size, size);
          ctx.restore();
        };
        tempImg.src = dataUrl;
        return;
      }
    } catch (e) {
      console.error('Error drawing logo from dataUrlCache:', e);
    }
  }
  
  // If we reach here, both caches failed
  console.log(`Unable to draw logo, using fallback: ${url}`);
  drawFallbackLogo(ctx, x, y, size);
};

// Draw a fallback logo (a simple shield icon)
const drawFallbackLogo = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  
  // Draw a shield shape
  ctx.beginPath();
  ctx.moveTo(x + size/2, y);
  ctx.lineTo(x + size, y + size/4);
  ctx.lineTo(x + size, y + size/2);
  ctx.quadraticCurveTo(x + size/2, y + size, x, y + size/2);
  ctx.lineTo(x, y + size/4);
  ctx.closePath();
  
  // Fill with a gradient
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, '#2C3E50');
  gradient.addColorStop(1, '#1A2533');
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add a border
  ctx.strokeStyle = '#4A5568';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
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
