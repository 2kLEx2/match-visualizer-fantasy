export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
};

export const truncateText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  let truncatedText = text;
  while (ctx.measureText(truncatedText).width > maxWidth && truncatedText.length > 0) {
    truncatedText = truncatedText.slice(0, -1);
  }
  if (truncatedText.length < text.length) {
    truncatedText = truncatedText.slice(0, -3) + "...";
  }
  return truncatedText;
};

export const drawTeamLogo = (
  ctx: CanvasRenderingContext2D,
  logoUrl: string,
  x: number,
  y: number,
  size: number,
  logoCache: Record<string, HTMLImageElement>,
  preserveAspectRatio = false
) => {
  try {
    const logo = logoCache[logoUrl];
    
    if (!logo) {
      console.warn(`Logo not found in cache: ${logoUrl}`);
      return;
    }
    
    if (preserveAspectRatio) {
      // Calculate dimensions while preserving aspect ratio
      const origWidth = logo.width;
      const origHeight = logo.height;
      
      if (origWidth === 0 || origHeight === 0) {
        console.warn(`Invalid image dimensions for ${logoUrl}: ${origWidth}x${origHeight}`);
        return;
      }
      
      let drawWidth = size;
      let drawHeight = size;
      
      const aspectRatio = origWidth / origHeight;
      
      if (aspectRatio > 1) {
        // Wider than tall
        drawHeight = size / aspectRatio;
      } else {
        // Taller than wide
        drawWidth = size * aspectRatio;
      }
      
      // Center the image in the allocated space
      const offsetX = (size - drawWidth) / 2;
      const offsetY = (size - drawHeight) / 2;
      
      ctx.drawImage(logo, x + offsetX, y + offsetY, drawWidth, drawHeight);
    } else {
      // Original behavior - square image
      ctx.drawImage(logo, x, y, size, size);
    }
  } catch (error) {
    console.error(`Error drawing logo ${logoUrl}:`, error);
  }
};
