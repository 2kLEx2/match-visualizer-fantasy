
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
    });
  }, [matches]);

  const renderLogo = (logo: string | undefined, teamName: string) => {
    if (!logo || !loadedImages[logo]) {
      return (
        <div className="w-[24px] h-[24px] flex items-center justify-center">
          <Shield className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    return (
      <img 
        src={logo}
        alt={`${teamName} logo`}
        className="w-[24px] h-[24px] object-contain"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error(`Error loading image for ${teamName}:`, e);
          setLoadedImages(prev => ({ ...prev, [logo]: false }));
        }}
      />
    );
  };

  const isBIGMatch = (match: Match) => {
    return match.team1.name === "BIG" || match.team2.name === "BIG";
  };

  return (
    <div 
      className="space-y-4 w-[600px] animate-fade-in relative"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        backgroundImage: 'url(https://static-cdn.jtvnw.net/jtv_user_pictures/60c2e503-6d45-4e92-980a-5ff326c2ffc0-channel_offline_image-1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <h1 className="text-2xl font-bold text-white mb-4 text-center">
        Watchparty Schedule
      </h1>

      {matches.map((match) => {
        const isBIG = isBIGMatch(match);
        return (
          <div key={match.id} className="space-y-1">
            <div 
              className={`rounded-md overflow-hidden transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm ${
                isBIG ? 'bg-primary/20' : 'bg-[#1B2028]/90'
              }`}
            >
              <div className="px-3 py-2 flex items-center">
                {/* Match Time */}
                {settings.showTime && (
                  <div className="text-base font-medium text-gray-400 w-[70px]">
                    {match.time}
                  </div>
                )}

                {/* Teams Container */}
                <div className="flex items-center gap-8 flex-1">
                  {/* Team 1 */}
                  <div className="flex items-center gap-2">
                    {settings.showLogos && renderLogo(match.team1.logo, match.team1.name)}
                    <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
                      {match.team1.name}
                    </span>
                  </div>

                  {/* VS Separator */}
                  <span className="text-xs font-medium text-gray-500">
                    vs
                  </span>

                  {/* Team 2 */}
                  <div className="flex items-center gap-2">
                    {settings.showLogos && renderLogo(match.team2.logo, match.team2.name)}
                    <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
                      {match.team2.name}
                    </span>
                  </div>
                </div>

                {/* Tournament region indicator */}
                <div className="text-xs font-medium text-gray-500 uppercase ml-2">
                  POL
                </div>
              </div>
            </div>
            {isBIG && (
              <div className="text-xs text-primary font-medium text-center italic">
                Anwesenheitspflicht
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
