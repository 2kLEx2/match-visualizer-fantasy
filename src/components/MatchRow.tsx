
import React from 'react';
import { Match } from '@/lib/api/matches';

interface MatchRowProps {
  match: Match;
  isBIG: boolean;
  showTime: boolean;
  showLogos: boolean;
  loadedImages: Record<string, boolean>;
  loadingStates: Record<string, boolean>;
}

export const MatchRow = ({ 
  match, 
  isBIG,
  showTime
}: MatchRowProps) => {
  return (
    <div className="space-y-1">
      <div 
        className={`rounded-md overflow-hidden transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm ${
          isBIG ? 'bg-primary/20' : 'bg-[#1B2028]/90'
        }`}
      >
        <div className="px-3 py-2 flex items-center gap-4">
          {showTime && (
            <div className="text-base font-medium text-gray-400 w-[70px]">
              {match.time}
            </div>
          )}

          <div className="flex items-center gap-8 flex-1">
            <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
              {match.team1.name}
            </span>

            <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
              {match.team2.name}
            </span>
          </div>

          <div className="text-xs font-medium text-gray-500 uppercase ml-2">
            {match.tournament}
          </div>
        </div>
      </div>
      {isBIG && (
        <div className="text-xs text-primary font-medium italic pl-[70px]">
          Anwesenheitspflicht
        </div>
      )}
    </div>
  );
};
