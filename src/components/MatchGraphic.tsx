
import React, { useEffect, useRef, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { Shield } from 'lucide-react';

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
  const scaleFactor = settings.scale / 100;
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const preloadImage = (src: string) => {
    if (!src) return Promise.reject(new Error('No image source provided'));
    if (loadedImages[src] !== undefined) return Promise.resolve(src);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [src]: true }));
        resolve(src);
      };
      img.onerror = () => {
        // Silently handle the error and mark the image as failed
        setLoadedImages(prev => ({ ...prev, [src]: false }));
        resolve(src); // Resolve anyway to prevent error propagation
      };
      img.src = src;
    });
  };

  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = matches.flatMap(match => [
        match.team1.logo && preloadImage(match.team1.logo),
        match.team2.logo && preloadImage(match.team2.logo),
      ]).filter(Boolean);

      // Wait for all images to either load or fail silently
      await Promise.all(imagePromises).catch(() => {
        // Ignore any errors since we handle them in preloadImage
      });
    };

    loadImages();
  }, [matches]);

  const renderLogo = (logo: string | undefined, teamName: string) => {
    // Show fallback if no logo or if logo failed to load
    if (!logo || !loadedImages[logo]) {
      return (
        <div className="w-10 h-10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-[#9b87f5]" />
        </div>
      );
    }

    // Show logo if it loaded successfully
    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
      />
    );
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl w-[600px]"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        background: `linear-gradient(to right, ${settings.backgroundColor}, #9b87f5)`,
      }}
    >
      <div className="p-8 space-y-6">
        <div className="text-xl font-bold text-center mb-6 opacity-90 bg-clip-text text-transparent bg-gradient-to-r from-[#9b87f5] to-[#7E69AB]">
          {matches[0]?.tournament}
        </div>
        {matches.map((match) => (
          <div 
            key={match.id} 
            className="flex items-center justify-between p-4 rounded-lg backdrop-blur-sm bg-[#1A1F2C]/40 hover:bg-[#1A1F2C]/60 transition-all border border-[#9b87f5]/20"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                {settings.showLogos && (
                  <div className="w-12 h-12 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20">
                    {renderLogo(match.team1.logo, match.team1.name)}
                  </div>
                )}
                <span className="font-bold text-xl">{match.team1.name}</span>
              </div>
              
              <div className="flex flex-col items-center mx-4">
                <span className="text-lg font-semibold text-[#9b87f5]">VS</span>
                {settings.showTime && (
                  <span className="text-sm mt-1 text-[#D6BCFA]">{match.time}</span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-bold text-xl">{match.team2.name}</span>
                {settings.showLogos && (
                  <div className="w-12 h-12 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20">
                    {renderLogo(match.team2.logo, match.team2.name)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
