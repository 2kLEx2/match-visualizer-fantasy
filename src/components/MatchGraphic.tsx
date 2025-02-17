
import React, { useEffect, useState } from 'react';
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
      if (match.tournament_logo) preloadImage(match.tournament_logo).catch(console.error);
    });
  }, [matches]);

  const renderLogo = (logo: string | undefined, teamName: string) => {
    if (!logo || !loadedImages[logo]) {
      return (
        <div className="w-[50px] h-[50px] flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-[50px] h-[50px] object-contain"
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
      className="space-y-6 w-[1066px] animate-fade-in"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      {matches.map((match) => (
        <div 
          key={match.id}
          className="rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
          style={{
            background: 'linear-gradient(to bottom, #959595, #3b3b3b)',
          }}
        >
          <div className="p-6 grid grid-cols-[auto_1fr_auto] gap-5 items-center">
            {/* Match Time */}
            {settings.showTime && (
              <div className="text-3xl font-bold text-black min-w-[100px] text-center">
                {match.time}
              </div>
            )}

            {/* Teams */}
            <div className="flex flex-col gap-5 min-w-[400px]">
              {/* Team 1 */}
              <div className="flex items-center gap-[50px]">
                {settings.showLogos && (
                  <div className="ml-20">
                    {renderLogo(match.team1.logo, match.team1.name)}
                  </div>
                )}
                <span className="text-2xl font-bold text-black">
                  {match.team1.name}
                </span>
              </div>

              {/* Separator */}
              <div className="h-0.5 bg-black/20 w-[300px] ml-6" />

              {/* Team 2 */}
              <div className="flex items-center gap-[50px]">
                {settings.showLogos && (
                  <div className="ml-20">
                    {renderLogo(match.team2.logo, match.team2.name)}
                  </div>
                )}
                <span className="text-2xl font-bold text-black">
                  {match.team2.name}
                </span>
              </div>
            </div>

            {/* Tournament Section */}
            <div className="flex items-center gap-5 min-w-[400px]">
              {/* Tournament Logo Container */}
              <div className="w-[200px] flex items-center justify-center">
                <img 
                  src={match.tournament_logo || '/placeholder.svg'}
                  alt={`${match.tournament} logo`}
                  className="w-[78px] h-[78px] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Tournament Name */}
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-black max-w-[400px] text-center">
                  {match.tournament}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
