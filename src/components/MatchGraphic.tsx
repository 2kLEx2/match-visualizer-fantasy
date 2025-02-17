
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
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            
            return new Promise<void>((resolve) => {
              reader.onloadend = () => {
                loadedImagesMap[id] = reader.result as string;
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(`Failed to load image: ${url}`, error);
            return Promise.resolve();
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
