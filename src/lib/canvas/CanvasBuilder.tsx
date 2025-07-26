// React wrapper for the Canvas Build System
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasBuildSystem, Match, BuildSettings } from './CanvasBuildSystem';

interface CanvasBuilderProps {
  matches: Match[];
  settings: BuildSettings;
  highlightedIds?: string[];
  onReady?: (buildSystem: CanvasBuildSystem) => void;
  className?: string;
}

export const CanvasBuilder: React.FC<CanvasBuilderProps> = ({
  matches,
  settings,
  highlightedIds = [],
  onReady,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buildSystemRef = useRef<CanvasBuildSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeBuildSystem = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Initialize build system
      const buildSystem = new CanvasBuildSystem(canvasRef.current);
      buildSystemRef.current = buildSystem;

      // Load images
      await buildSystem.loadImages(matches);

      // Draw graphic
      buildSystem.drawGraphic(matches, settings, highlightedIds);

      // Notify parent component
      onReady?.(buildSystem);

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing canvas build system:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [matches, settings, highlightedIds, onReady]);

  useEffect(() => {
    initializeBuildSystem();

    // Cleanup
    return () => {
      buildSystemRef.current?.destroy();
    };
  }, [initializeBuildSystem]);

  const handleRetry = useCallback(() => {
    initializeBuildSystem();
  }, [initializeBuildSystem]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading images...</p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`max-w-full h-auto ${isLoading ? 'opacity-50' : ''}`}
        style={{
          display: 'block',
          transform: `scale(${settings.scale || 1})`,
          transformOrigin: 'top left'
        }}
      />
    </div>
  );
};

// Hook for easier usage
export const useCanvasBuilder = () => {
  const [buildSystem, setBuildSystem] = useState<CanvasBuildSystem | null>(null);

  const downloadImage = useCallback(async (filename?: string) => {
    if (!buildSystem) return;
    await buildSystem.downloadImage(filename);
  }, [buildSystem]);

  const getDataURL = useCallback((type?: string, quality?: number) => {
    if (!buildSystem) return '';
    return buildSystem.toDataURL(type, quality);
  }, [buildSystem]);

  const getBlob = useCallback(async (type?: string, quality?: number) => {
    if (!buildSystem) return null;
    return buildSystem.toBlob(type, quality);
  }, [buildSystem]);

  return {
    buildSystem,
    setBuildSystem,
    downloadImage,
    getDataURL,
    getBlob
  };
};