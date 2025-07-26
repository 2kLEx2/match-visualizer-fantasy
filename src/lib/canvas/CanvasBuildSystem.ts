// Standalone Canvas Build System for Match Graphics
// Extracted from the main application for reusability

export interface Match {
  id: string;
  team1: { name: string; logo?: string };
  team2: { name: string; logo?: string };
  time: string;
  tournament?: string;
  isCustomEntry?: boolean;
}

export interface BuildSettings {
  showLogos: boolean;
  showTime: boolean;
  backgroundColor: string;
  textColor: string;
  title?: string;
  scale?: number;
  width?: number;
  height?: number;
}

export interface ImageCache {
  [url: string]: HTMLImageElement;
}

// Core canvas drawing utilities
export class CanvasDrawingUtils {
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: string
  ) {
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
  }

  static truncateText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string {
    let truncatedText = text;
    while (ctx.measureText(truncatedText).width > maxWidth && truncatedText.length > 0) {
      truncatedText = truncatedText.slice(0, -1);
    }
    if (truncatedText.length < text.length) {
      truncatedText = truncatedText.slice(0, -3) + "...";
    }
    return truncatedText;
  }

  static drawTeamLogo(
    ctx: CanvasRenderingContext2D,
    logoUrl: string,
    x: number,
    y: number,
    size: number,
    logoCache: ImageCache,
    preserveAspectRatio = false
  ) {
    try {
      if (!logoUrl) return;

      const logo = logoCache[logoUrl];
      if (!logo) return;
      
      if (preserveAspectRatio) {
        const origWidth = logo.width;
        const origHeight = logo.height;
        
        if (origWidth === 0 || origHeight === 0) return;
        
        let drawWidth = size;
        let drawHeight = size;
        
        const aspectRatio = origWidth / origHeight;
        
        if (aspectRatio > 1) {
          drawHeight = size / aspectRatio;
        } else {
          drawWidth = size * aspectRatio;
        }
        
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;
        
        ctx.drawImage(logo, x + offsetX, y + offsetY, drawWidth, drawHeight);
      } else {
        ctx.drawImage(logo, x, y, size, size);
      }
    } catch (error) {
      console.error(`Error drawing logo:`, error);
    }
  }
}

// Image loading and caching system
export class ImageLoader {
  private static dataUrlCache = new Map<string, string>();
  private static loadingCache = new Map<string, Promise<boolean>>();
  private static loadedImages = new Map<string, boolean>();

  static async loadImage(url: string): Promise<boolean> {
    if (!url) return false;

    // Check if already loaded
    if (this.loadedImages.get(url)) return true;
    
    // Check if currently loading
    if (this.loadingCache.has(url)) {
      return this.loadingCache.get(url)!;
    }

    // Start loading
    const loadPromise = this.doLoadImage(url);
    this.loadingCache.set(url, loadPromise);
    
    return loadPromise;
  }

  private static async doLoadImage(url: string): Promise<boolean> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise<boolean>((resolve) => {
        img.onload = () => {
          this.loadedImages.set(url, true);
          resolve(true);
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${url}`);
          resolve(false);
        };
      });

      img.src = url;
      return loadPromise;
    } catch (error) {
      console.error(`Error loading image ${url}:`, error);
      return false;
    }
  }

  static async loadImages(urls: string[]): Promise<ImageCache> {
    const cache: ImageCache = {};
    
    // Filter out empty URLs
    const validUrls = urls.filter(url => url && url.trim());
    
    // Load all images in parallel
    await Promise.all(
      validUrls.map(async (url) => {
        const loaded = await this.loadImage(url);
        if (loaded) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          cache[url] = img;
        }
      })
    );

    return cache;
  }

  static clearCache() {
    this.dataUrlCache.clear();
    this.loadingCache.clear();
    this.loadedImages.clear();
  }
}

// Match drawing on canvas
export class MatchDrawer {
  static drawMatch(
    ctx: CanvasRenderingContext2D,
    match: Match,
    x: number,
    y: number,
    width: number,
    height: number,
    settings: BuildSettings,
    logoCache: ImageCache,
    isHighlighted = false
  ) {
    const { showLogos, showTime, textColor } = settings;
    const scale = isHighlighted ? 1.1 : 1;
    const scaledHeight = height * scale;
    const scaledY = y - (scaledHeight - height) / 2;

    // Background
    const bgColor = isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)';
    CanvasDrawingUtils.drawRoundedRect(ctx, x, scaledY, width, scaledHeight, 8, bgColor);

    const logoSize = Math.min(scaledHeight * 0.6, 40);
    const padding = 16;
    let currentX = x + padding;

    // Time
    if (showTime && match.time) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.fillText(match.time, currentX, scaledY + scaledHeight / 2 + 5);
      currentX += 80;
    }

    // Team 1
    if (showLogos && match.team1.logo) {
      CanvasDrawingUtils.drawTeamLogo(
        ctx,
        match.team1.logo,
        currentX,
        scaledY + (scaledHeight - logoSize) / 2,
        logoSize,
        logoCache,
        true
      );
      currentX += logoSize + 12;
    }

    ctx.font = '16px Arial';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    const team1Text = CanvasDrawingUtils.truncateText(ctx, match.team1.name, 120);
    ctx.fillText(team1Text, currentX, scaledY + scaledHeight / 2 + 5);
    currentX += 140;

    // VS
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'rgba(156, 163, 175, 1)';
    ctx.textAlign = 'center';
    ctx.fillText('vs', currentX, scaledY + scaledHeight / 2 + 5);
    currentX += 40;

    // Team 2
    if (showLogos && match.team2.logo) {
      CanvasDrawingUtils.drawTeamLogo(
        ctx,
        match.team2.logo,
        currentX,
        scaledY + (scaledHeight - logoSize) / 2,
        logoSize,
        logoCache,
        true
      );
      currentX += logoSize + 12;
    }

    ctx.font = '16px Arial';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    const team2Text = CanvasDrawingUtils.truncateText(ctx, match.team2.name, 120);
    ctx.fillText(team2Text, currentX, scaledY + scaledHeight / 2 + 5);

    // Tournament
    if (match.tournament) {
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(156, 163, 175, 1)';
      ctx.textAlign = 'right';
      const tournamentText = CanvasDrawingUtils.truncateText(ctx, match.tournament, 150);
      ctx.fillText(tournamentText, x + width - padding, scaledY + scaledHeight / 2 + 5);
    }
  }
}

// Main Canvas Build System
export class CanvasBuildSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: ImageCache = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to get 2D context from canvas');
    }
    this.ctx = context;
  }

  async loadImages(matches: Match[]): Promise<void> {
    // Extract all logo URLs
    const logoUrls = matches
      .flatMap(match => [match.team1.logo, match.team2.logo])
      .filter((url): url is string => Boolean(url));

    // Load images
    this.imageCache = await ImageLoader.loadImages(logoUrls);
  }

  drawGraphic(matches: Match[], settings: BuildSettings, highlightedIds: string[] = []) {
    const { backgroundColor, textColor, title, width = 800, height = 600 } = settings;

    // Set canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    let currentY = 20;

    // Title
    if (title) {
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = textColor;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(title, width / 2, currentY + 30);
      currentY += 60;
    }

    // Matches
    const matchHeight = 60;
    const matchPadding = 10;

    matches.forEach((match) => {
      const isHighlighted = highlightedIds.includes(match.id);
      
      MatchDrawer.drawMatch(
        this.ctx,
        match,
        20,
        currentY,
        width - 40,
        matchHeight,
        settings,
        this.imageCache,
        isHighlighted
      );

      currentY += matchHeight + matchPadding;
    });
  }

  async toBlob(type = 'image/png', quality = 1): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }

  toDataURL(type = 'image/png', quality = 1): string {
    return this.canvas.toDataURL(type, quality);
  }

  async downloadImage(filename = 'match-graphic.png') {
    const blob = await this.toBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    ImageLoader.clearCache();
    this.imageCache = {};
  }
}