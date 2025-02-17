
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, ChevronDown, ChevronRight } from 'lucide-react';

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
  // Group matches by tournament
  const matchesByTournament = matches.reduce((acc, match) => {
    if (!acc[match.tournament]) {
      acc[match.tournament] = [];
    }
    acc[match.tournament].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Track expanded state for each tournament
  const [expandedTournaments, setExpandedTournaments] = useState<Record<string, boolean>>(() => {
    // Initially expand all tournaments
    return Object.keys(matchesByTournament).reduce((acc, tournament) => {
      acc[tournament] = true;
      return acc;
    }, {} as Record<string, boolean>);
  });

  const toggleTournament = (tournament: string) => {
    setExpandedTournaments(prev => ({
      ...prev,
      [tournament]: !prev[tournament]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {Object.entries(matchesByTournament).map(([tournament, tournamentMatches]) => (
        <div key={tournament} className="space-y-2">
          <button
            onClick={() => toggleTournament(tournament)}
            className="w-full flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-2">
              {expandedTournaments[tournament] ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">{tournament}</span>
              <Badge variant="outline" className="ml-2">
                {tournamentMatches.length} matches
              </Badge>
            </div>
          </button>

          {expandedTournaments[tournament] && (
            <div className="space-y-2 pl-4">
              {tournamentMatches.map((match) => (
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
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{match.time}</span>
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
