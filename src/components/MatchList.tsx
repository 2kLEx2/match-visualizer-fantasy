
import React from 'react';
import { Match } from '@/lib/api/matches';
import { MatchRow } from './MatchRow';

interface MatchListProps {
  matches: Match[];
  selectedMatches: string[];
  onMatchSelect: (matchId: string) => void;
  highlightedMatches?: string[];
  onHighlightToggle?: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  selectedMatches,
  onMatchSelect,
  highlightedMatches = [],
  onHighlightToggle
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {matches.map((match) => {
        const isSelected = selectedMatches.includes(match.id);
        const isHighlighted = highlightedMatches.includes(match.id);
        const isBIG = match.team1.name === "BIG" || match.team2.name === "BIG";

        return (
          <div
            key={match.id}
            className={`relative transition-all duration-200 ${
              isSelected ? 'scale-[1.02]' : ''
            }`}
            onClick={() => onMatchSelect(match.id)}
          >
            <MatchRow
              match={match}
              isBIG={isBIG}
              showTime={true}
              showLogos={true}
              loadedImages={{}}
              loadingStates={{}}
              isHighlighted={isHighlighted}
              onHighlightToggle={onHighlightToggle}
            />
          </div>
        );
      })}
    </div>
  );
};
