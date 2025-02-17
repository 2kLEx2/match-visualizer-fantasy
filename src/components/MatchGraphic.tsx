
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
        <div className="w-14 h-14 flex items-center justify-center">
          <Shield className="w-8 h-8 text-[#9b87f5]" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-14 h-14 object-contain"
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
      className="rounded-3xl overflow-hidden shadow-2xl w-[700px] animate-fade-in"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Header with Tournament Name */}
      <div 
        className="relative h-32 px-8 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #9b87f5 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[#1A1F2C]/20 backdrop-blur-sm" />
        <div className="relative z-10 flex flex-col items-center">
          <Trophy className="w-10 h-10 text-[#D6BCFA] mb-2" />
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {matches[0]?.tournament}
          </h2>
        </div>
      </div>

      {/* Matches Container */}
      <div 
        className="bg-[#1A1F2C] p-8 space-y-6"
        style={{ color: settings.textColor }}
      >
        {matches.map((match) => (
          <div 
            key={match.id} 
            className="relative p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-r from-[#2A2F3C] to-[#353B4A] hover:from-[#353B4A] hover:to-[#404859] transition-all duration-300 border border-[#9b87f5]/20"
          >
            <div className="flex items-center justify-between gap-6">
              {/* Team 1 */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {settings.showLogos && (
                    <div className="w-16 h-16 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20">
                      {renderLogo(match.team1.logo, match.team1.name)}
                    </div>
                  )}
                  <span className="text-2xl font-bold tracking-tight">{match.team1.name}</span>
                </div>
              </div>
              
              {/* VS and Time */}
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-2xl font-bold text-[#9b87f5] tracking-wider mb-2">VS</span>
                {settings.showTime && (
                  <div className="px-4 py-1.5 rounded-full bg-[#9b87f5]/10 border border-[#9b87f5]/20">
                    <span className="text-sm font-medium text-[#D6BCFA]">{match.time}</span>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex-1">
                <div className="flex items-center justify-end space-x-4">
                  <span className="text-2xl font-bold tracking-tight">{match.team2.name}</span>
                  {settings.showLogos && (
                    <div className="w-16 h-16 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20">
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
