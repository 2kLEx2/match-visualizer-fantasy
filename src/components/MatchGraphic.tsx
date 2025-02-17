
import React from 'react';
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
  const scaleFactor = settings.scale / 100;
  
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
                <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
              )}
              <span className="font-bold text-lg">{match.team1.name}</span>
              <span className="text-lg">vs</span>
              {settings.showLogos && (
                <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 object-contain" />
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
