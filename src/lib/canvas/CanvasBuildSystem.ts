// Standalone Canvas Build System for Match Graphics
// Extracted from the main application for reusability

// Import types from centralized location
import type { Match, BuildSettings, ImageCache } from './types';
export type { Match, BuildSettings, ImageCache } from './types';

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

// Enhanced Match drawing on canvas - using the more sophisticated drawing logic
export class MatchDrawer {
  static drawMatch(
    ctx: CanvasRenderingContext2D,
    match: Match,
    y: number,
    isBIG: boolean,
    width: number,
    settings: BuildSettings & { totalSelectedMatches?: number },
    logoCache: ImageCache,
    isHighlighted = false
  ) {
    // Determine if we should scale up matches (1-2 selected matches only)
    const shouldScaleUpMatches = settings.totalSelectedMatches && settings.totalSelectedMatches <= 2;
    const heightScaleFactor = shouldScaleUpMatches ? 1.8 : 1;
    
    const baseRowHeight = 72; // base height for compact layout
    const rowHeight = isHighlighted ? baseRowHeight * 2 * heightScaleFactor : baseRowHeight * heightScaleFactor;
    const verticalGap = 20 * heightScaleFactor; // spacing between matchboxes
    const padding = 48;
    const logoSize = 49; // Keep logo size unchanged
    const logoTextGap = 16; // Keep gaps unchanged
    const borderWidth = 4; // Keep border width unchanged

    const verticalCenter = y + verticalGap / 2 + rowHeight / 2;

    // Draw background box with border for highlighted matches
    if (isHighlighted) {
      // Draw border first (white with 0.5 opacity)
      CanvasDrawingUtils.drawRoundedRect(
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
    CanvasDrawingUtils.drawRoundedRect(
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
      ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#9CA3AF';
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
      CanvasDrawingUtils.drawTeamLogo(
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
    const team1Name = CanvasDrawingUtils.truncateText(ctx, match.team1.name, maxTextWidth);
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
      CanvasDrawingUtils.drawTeamLogo(
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
    const team2Name = CanvasDrawingUtils.truncateText(ctx, match.team2.name, maxTextWidth);
    ctx.fillText(team2Name, team2NameX, verticalCenter);

    // --- Tournament Name
    if (match.tournament) {
      ctx.font = '16px Inter';
      ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#6B7280';
      ctx.textAlign = 'right';
      ctx.fillText(match.tournament, width - padding - 16, verticalCenter);
    }

    // --- BIG Special Label
    if (isBIG && !('isCustomEntry' in match)) {
      ctx.fillStyle = '#10A37F';
      ctx.font = 'italic 30px Inter';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const labelY = isHighlighted ? y + verticalGap / 2 + rowHeight + 12 : y + verticalGap / 2 + rowHeight + 6;
      ctx.fillText('Anwesenheitspflicht', padding + timeBlockWidth, labelY);
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

    // Enhanced settings for match drawing
    const enhancedSettings = {
      ...settings,
      totalSelectedMatches: matches.length
    };

    // Calculate dynamic spacing based on match count
    const baseSpacing = matches.length <= 2 ? 120 : 80;
    
    matches.forEach((match, index) => {
      const isHighlighted = highlightedIds.includes(match.id);
      const isBIG = false; // Can be customized based on match importance
      
      MatchDrawer.drawMatch(
        this.ctx,
        match,
        currentY,
        isBIG,
        width,
        enhancedSettings,
        this.imageCache,
        isHighlighted
      );

      currentY += baseSpacing;
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