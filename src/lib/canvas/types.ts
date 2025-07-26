// Type definitions for the Canvas Build System
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
  totalSelectedMatches?: number;
}

export interface ImageCache {
  [url: string]: HTMLImageElement;
}

export interface CanvasBuilderProps {
  matches: Match[];
  settings: BuildSettings;
  highlightedIds?: string[];
  onReady?: (buildSystem: any) => void;
  className?: string;
}