
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
    // Replace failed image with a div containing the Shield icon
    const imgElement = e.currentTarget;
    imgElement.style.display = 'none';
    const iconContainer = imgElement.parentElement;
    if (iconContainer) {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'w-8 h-8 flex items-center justify-center bg-white/10 rounded';
      iconDiv.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`;
      iconContainer.appendChild(iconDiv);
    }
  };
  
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
                <div className="w-8 h-8 relative">
                  <img 
                    src={match.team1.logo}
                    alt={match.team1.name} 
                    className="w-8 h-8 object-contain"
                    onError={handleImageError}
                  />
                </div>
              )}
              <span className="font-bold text-lg">{match.team1.name}</span>
              <span className="text-lg">vs</span>
              {settings.showLogos && (
                <div className="w-8 h-8 relative">
                  <img 
                    src={match.team2.logo}
                    alt={match.team2.name} 
                    className="w-8 h-8 object-contain"
                    onError={handleImageError}
                  />
                </div>
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
