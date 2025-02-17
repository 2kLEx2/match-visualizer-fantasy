
import React, { useEffect, useRef, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { Shield, Trophy } from 'lucide-react';

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
        <div className="w-10 h-10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-[#9b87f5]" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-10 h-10 object-contain"
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
      className="rounded-2xl overflow-hidden shadow-2xl w-[600px] animate-fade-in"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, #9b87f5 100%)`,
      }}
    >
      <div className="p-8 space-y-6 relative">
        {/* Tournament Header with Trophy Icon */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="w-6 h-6 text-[#9b87f5]" />
          <div className="text-2xl font-bold text-center opacity-90 bg-clip-text text-transparent bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA]">
            {matches[0]?.tournament}
          </div>
        </div>

        {/* Matches Container */}
        <div className="space-y-4">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className="relative p-6 rounded-xl backdrop-blur-sm bg-gradient-to-r from-[#1A1F2C]/40 to-[#1A1F2C]/60 hover:from-[#1A1F2C]/50 hover:to-[#1A1F2C]/70 transition-all border border-[#9b87f5]/20 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
              <div className="flex items-center justify-between w-full">
                {/* Team 1 */}
                <div className="flex items-center space-x-4">
                  {settings.showLogos && (
                    <div className="w-14 h-14 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20 shadow-inner">
                      {renderLogo(match.team1.logo, match.team1.name)}
                    </div>
                  )}
                  <span className="font-bold text-xl tracking-tight">{match.team1.name}</span>
                </div>
                
                {/* VS and Time */}
                <div className="flex flex-col items-center mx-6">
                  <span className="text-xl font-bold text-[#9b87f5] tracking-widest">VS</span>
                  {settings.showTime && (
                    <span className="text-sm mt-2 px-3 py-1 rounded-full bg-[#9b87f5]/10 text-[#D6BCFA] font-medium">
                      {match.time}
                    </span>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-xl tracking-tight">{match.team2.name}</span>
                  {settings.showLogos && (
                    <div className="w-14 h-14 relative bg-[#9b87f5]/10 rounded-full p-2 backdrop-blur-sm border border-[#9b87f5]/20 shadow-inner">
                      {renderLogo(match.team2.logo, match.team2.name)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
