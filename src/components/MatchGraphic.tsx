
import React, { useEffect, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { Shield, Clock } from 'lucide-react';

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

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [src]: true }));
        resolve(src);
      };
      img.onerror = (error) => {
        console.error('Image load error:', error);
        setLoadedImages(prev => ({ ...prev, [src]: false }));
        reject(error);
      };
      img.src = src;
    });
  };

  useEffect(() => {
    matches.forEach(match => {
      if (match.team1.logo) preloadImage(match.team1.logo).catch(console.error);
      if (match.team2.logo) preloadImage(match.team2.logo).catch(console.error);
    });
  }, [matches]);

  const renderLogo = (logo: string | undefined, teamName: string) => {
    if (!logo || !loadedImages[logo]) {
      return (
        <div className="w-[32px] h-[32px] flex items-center justify-center">
          <Shield className="w-6 h-6 text-gray-400" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-[32px] h-[32px] object-contain"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error(`Error loading image for ${teamName}:`, e);
          setLoadedImages(prev => ({ ...prev, [logo]: false }));
        }}
      />
    );
  };

  return (
    <div 
      className="space-y-4 w-[800px] animate-fade-in"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      {matches.map((match) => (
        <div 
          key={match.id}
          className="rounded-lg overflow-hidden transition-all duration-300 hover:bg-slate-800/50"
          style={{
            background: 'linear-gradient(to right, #1a1a1a, #2d2d2d)',
          }}
        >
          <div className="p-4 flex items-center gap-6">
            {/* Match Time */}
            {settings.showTime && (
              <div className="flex items-center gap-2 min-w-[100px]">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-medium text-white">
                  {match.time}
                </span>
              </div>
            )}

            {/* Teams Container */}
            <div className="flex items-center gap-4 flex-1">
              {/* Team 1 */}
              <div className="flex items-center gap-3">
                {settings.showLogos && renderLogo(match.team1.logo, match.team1.name)}
                <span className="text-lg font-medium text-white">
                  {match.team1.name}
                </span>
              </div>

              {/* VS Separator */}
              <span className="text-sm font-medium text-gray-500 px-2">
                vs
              </span>

              {/* Team 2 */}
              <div className="flex items-center gap-3">
                {settings.showLogos && renderLogo(match.team2.logo, match.team2.name)}
                <span className="text-lg font-medium text-white">
                  {match.team2.name}
                </span>
              </div>
            </div>

            {/* Tournament Name (Optional) */}
            <div className="min-w-[200px] text-right">
              <span className="text-sm font-medium text-gray-400">
                {match.tournament}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
