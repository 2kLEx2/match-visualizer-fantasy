
import React from 'react';
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.currentTarget;
    imgElement.style.display = 'none';
    const iconContainer = imgElement.parentElement;
    if (iconContainer) {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'w-10 h-10 flex items-center justify-center bg-white/10 rounded-full';
      iconDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`;
      iconContainer.appendChild(iconDiv);
    }
  };
  
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        background: `linear-gradient(to right, ${settings.backgroundColor}, ${settings.backgroundColor}ee)`,
      }}
    >
      <div className="p-8 space-y-6">
        <div className="text-lg font-bold text-center mb-6 opacity-80">
          {matches[0]?.tournament}
        </div>
        {matches.map((match) => (
          <div 
            key={match.id} 
            className="flex items-center justify-between p-4 rounded-lg backdrop-blur-sm bg-black/10 hover:bg-black/20 transition-all"
          >
            <div className="flex items-center space-x-6 flex-1">
              <div className="flex items-center space-x-4 flex-1">
                {settings.showLogos && (
                  <div className="w-12 h-12 relative bg-white/5 rounded-full p-2 backdrop-blur-sm">
                    <img 
                      src={match.team1.logo}
                      alt={match.team1.name} 
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
                  </div>
                )}
                <span className="font-bold text-xl">{match.team1.name}</span>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <span className="text-lg font-semibold opacity-60">VS</span>
                {settings.showTime && (
                  <span className="text-sm mt-1 opacity-50">{match.time}</span>
                )}
              </div>

              <div className="flex items-center space-x-4 flex-1 justify-end">
                <span className="font-bold text-xl">{match.team2.name}</span>
                {settings.showLogos && (
                  <div className="w-12 h-12 relative bg-white/5 rounded-full p-2 backdrop-blur-sm">
                    <img 
                      src={match.team2.logo}
                      alt={match.team2.name} 
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
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
