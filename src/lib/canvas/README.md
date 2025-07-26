# Canvas Build System

A standalone, reusable canvas-based graphic generation system for match schedules and sports graphics.

## 🎯 Standalone Module

This Canvas Build System has been extracted as a completely independent module that can be used in any React project. It has zero dependencies on the host application and provides a clean API for generating match graphics.

## Features

- ✅ Canvas-based rendering for high-quality graphics
- ✅ Image loading and caching system
- ✅ Match visualization with team logos
- ✅ Customizable styling and themes
- ✅ Highlighting and scaling effects
- ✅ Export to PNG/JPEG formats
- ✅ React integration with hooks
- ✅ TypeScript support

## Installation & Setup

Since this is a standalone module, you can copy the entire `src/lib/canvas` directory to any React project.

### Required Dependencies

```bash
npm install react react-dom html2canvas
```

### Optional Dependencies (for React integration)
```bash
npm install @types/react @types/react-dom
```

## Usage

### Basic Usage

```tsx
import { CanvasBuilder, useCanvasBuilder } from './lib/canvas';

const MyComponent = () => {
  const { buildSystem, downloadImage } = useCanvasBuilder();

  const matches = [
    {
      id: '1',
      team1: { name: 'Team A', logo: '/logo1.png' },
      team2: { name: 'Team B', logo: '/logo2.png' },
      time: '14:00',
      tournament: 'Championship'
    }
  ];

  const settings = {
    showLogos: true,
    showTime: true,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    title: 'Match Schedule',
    width: 800,
    height: 600
  };

  return (
    <div>
      <CanvasBuilder
        matches={matches}
        settings={settings}
        onReady={setBuildSystem}
      />
      <button onClick={() => downloadImage('my-schedule.png')}>
        Download
      </button>
    </div>
  );
};
```

### Direct Canvas Usage

```typescript
import { CanvasBuildSystem } from './lib/canvas';

const canvas = document.createElement('canvas');
const buildSystem = new CanvasBuildSystem(canvas);

// Load images
await buildSystem.loadImages(matches);

// Draw graphic
buildSystem.drawGraphic(matches, settings, highlightedIds);

// Export
const blob = await buildSystem.toBlob();
const dataURL = buildSystem.toDataURL();
```

## API Reference

### CanvasBuildSystem Class

#### Constructor
```typescript
new CanvasBuildSystem(canvas: HTMLCanvasElement)
```

#### Methods
- `loadImages(matches: Match[]): Promise<void>` - Preload team logos
- `drawGraphic(matches: Match[], settings: BuildSettings, highlightedIds?: string[])` - Render the graphic
- `toBlob(type?: string, quality?: number): Promise<Blob | null>` - Export as blob
- `toDataURL(type?: string, quality?: number): string` - Export as data URL
- `downloadImage(filename?: string): Promise<void>` - Download the image
- `destroy(): void` - Cleanup resources

### Interfaces

#### Match
```typescript
interface Match {
  id: string;
  team1: { name: string; logo?: string };
  team2: { name: string; logo?: string };
  time: string;
  tournament?: string;
  isCustomEntry?: boolean;
}
```

#### BuildSettings
```typescript
interface BuildSettings {
  showLogos: boolean;
  showTime: boolean;
  backgroundColor: string;
  textColor: string;
  title?: string;
  scale?: number;
  width?: number;
  height?: number;
}
```

### React Components

#### CanvasBuilder
A React wrapper that handles the canvas lifecycle and image loading.

Props:
- `matches: Match[]` - Array of matches to render
- `settings: BuildSettings` - Display settings
- `highlightedIds?: string[]` - IDs of matches to highlight
- `onReady?: (buildSystem: CanvasBuildSystem) => void` - Callback when ready
- `className?: string` - CSS class name

#### useCanvasBuilder Hook
Provides convenient methods for interacting with the build system.

Returns:
- `buildSystem: CanvasBuildSystem | null` - The build system instance
- `setBuildSystem: (system: CanvasBuildSystem) => void` - Set the build system
- `downloadImage: (filename?: string) => Promise<void>` - Download function
- `getDataURL: (type?: string, quality?: number) => string` - Get data URL
- `getBlob: (type?: string, quality?: number) => Promise<Blob | null>` - Get blob

## Utility Classes

### ImageLoader
Handles image loading and caching with CORS support.

### CanvasDrawingUtils
Low-level drawing utilities for shapes, text, and logos.

### MatchDrawer
Specialized drawing logic for match visualization.

## Examples

### Custom Styling
```typescript
const settings = {
  showLogos: true,
  showTime: true,
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textColor: '#ffffff',
  title: 'Tournament Schedule',
  width: 1200,
  height: 800,
  scale: 1.2
};
```

### Highlighted Matches
```typescript
const highlightedIds = ['match-1', 'match-3'];

<CanvasBuilder
  matches={matches}
  settings={settings}
  highlightedIds={highlightedIds}
/>
```

### Export Options
```typescript
// PNG with high quality
const blob = await buildSystem.toBlob('image/png', 1);

// JPEG with compression
const dataURL = buildSystem.toDataURL('image/jpeg', 0.8);

// Download with custom filename
await buildSystem.downloadImage('tournament-finals.png');
```

## Performance Tips

1. **Image Caching**: Images are automatically cached to avoid redundant loading
2. **Canvas Reuse**: Reuse the same canvas element when possible
3. **Cleanup**: Call `destroy()` when done to free memory
4. **Batch Operations**: Load all images before drawing for better performance

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

Requires Canvas 2D API support and ES2017+ features.