
import React, { useEffect, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { Shield, Trophy, Star } from 'lucide-react';

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
        <div className="w-12 h-12 flex items-center justify-center">
          <Shield className="w-8 h-8 text-[#9b87f5]" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-12 h-12 object-contain"
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
      className="rounded-3xl overflow-hidden shadow-2xl w-[650px] animate-fade-in"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Header Banner */}
      <div 
        className="h-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #9b87f5 100%)`
        }}
      >
        <div className="absolute inset-0 bg-[#1A1F2C]/20 backdrop-blur-sm" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <Star className="w-6 h-6 text-[#D6BCFA] mr-3" />
          <h2 className="text-2xl font-bold text-white">
            {matches[0]?.tournament}
          </h2>
        </div>
      </div>

      {/* Matches List */}
      <div className="bg-[#1A1F2C] p-6 space-y-4">
        {matches.map((match) => (
          <div 
            key={match.id}
            className="bg-[#2A2F3C] rounded-2xl p-6 hover:bg-[#353B4A] transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              {/* Team 1 */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {settings.showLogos && (
                    <div className="w-16 h-16 rounded-full bg-[#9b87f5]/10 flex items-center justify-center border border-[#9b87f5]/20 p-2">
                      {renderLogo(match.team1.logo, match.team1.name)}
                    </div>
                  )}
                  <span className="text-xl font-bold text-white">
                    {match.team1.name}
                  </span>
                </div>
              </div>

              {/* Match Info */}
              <div className="flex flex-col items-center px-6 min-w-[120px]">
                <div className="text-2xl font-bold text-[#9b87f5] tracking-wider mb-2">VS</div>
                {settings.showTime && (
                  <div className="px-4 py-1.5 rounded-full bg-[#9b87f5]/10 border border-[#9b87f5]/20">
                    <span className="text-sm font-medium text-[#D6BCFA]">
                      {match.time}
                    </span>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex-1">
                <div className="flex items-center justify-end space-x-4">
                  <span className="text-xl font-bold text-white">
                    {match.team2.name}
                  </span>
                  {settings.showLogos && (
                    <div className="w-16 h-16 rounded-full bg-[#9b87f5]/10 flex items-center justify-center border border-[#9b87f5]/20 p-2">
                      {renderLogo(match.team2.logo, match.team2.name)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
