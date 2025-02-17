
import React, { useEffect, useState } from 'react';
import { Match } from '@/lib/api/matches';

interface MatchGraphicProps {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
    scale: number;
  };
}

export const MatchGraphic = ({ matches, settings }: MatchGraphicProps) => {
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: string }>({});
  const scaleFactor = settings.scale / 100;

  useEffect(() => {
    // Preload all images and convert them to base64
    const loadImages = async () => {
      const imagePromises = matches.flatMap(match => [
        { url: match.team1.logo, id: `${match.id}-team1` },
        { url: match.team2.logo, id: `${match.id}-team2` }
      ]);

      const loadedImagesMap: { [key: string]: string } = {};

      await Promise.all(
        imagePromises.map(async ({ url, id }) => {
          try {
            // Use img element to load image instead of fetch
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                // Create canvas to convert image to base64
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  try {
                    loadedImagesMap[id] = canvas.toDataURL('image/png');
                  } catch (e) {
                    console.error('Failed to convert image to base64:', e);
                  }
                }
                resolve();
              };
              img.onerror = () => {
                console.error(`Failed to load image: ${url}`);
                resolve(); // Resolve anyway to continue with other images
              };
              // Add timestamp to bypass cache
              img.src = `${url}?t=${new Date().getTime()}`;
            });
          } catch (error) {
            console.error(`Failed to process image: ${url}`, error);
          }
        })
      );

      setLoadedImages(loadedImagesMap);
    };

    if (settings.showLogos && matches.length > 0) {
      loadImages();
    }
  }, [matches, settings.showLogos]);
  
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      <div className="p-6 space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {settings.showLogos && (
                <img 
                  src={loadedImages[`${match.id}-team1`] || match.team1.logo} 
                  alt={match.team1.name} 
                  className="w-8 h-8 object-contain"
                  crossOrigin="anonymous"
                />
              )}
              <span className="font-bold text-lg">{match.team1.name}</span>
              <span className="text-lg">vs</span>
              {settings.showLogos && (
                <img 
                  src={loadedImages[`${match.id}-team2`] || match.team2.logo} 
                  alt={match.team2.name} 
                  className="w-8 h-8 object-contain"
                  crossOrigin="anonymous"
                />
              )}
              <span className="font-bold text-lg">{match.team2.name}</span>
            </div>
            {settings.showTime && (
              <span className="text-lg">{match.time}</span>
            )}
          </div>
        ))}
        <div className="text-sm mt-2 text-center">
          {matches[0]?.tournament}
        </div>
      </div>
    </div>
  );
};
