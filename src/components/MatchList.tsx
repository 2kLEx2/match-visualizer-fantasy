
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock } from 'lucide-react';

interface Team {
  name: string;
  logo: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  time: string;
  tournament: string;
}

interface MatchListProps {
  matches: Match[];
  selectedMatches: string[];
  onMatchSelect: (matchId: string) => void;
}

export const MatchList = ({ matches, selectedMatches, onMatchSelect }: MatchListProps) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {matches.map((match) => (
        <Card
          key={match.id}
          className="p-4 backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all duration-300 border-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedMatches.includes(match.id)}
                onCheckedChange={() => onMatchSelect(match.id)}
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="flex items-center space-x-2">
                <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
                <span className="font-semibold">{match.team1.name}</span>
                <span className="text-muted-foreground">vs</span>
                <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 object-contain" />
                <span className="font-semibold">{match.team2.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span>{match.tournament}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{match.time}</span>
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
