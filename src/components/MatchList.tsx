
import { useState, useCallback, memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  date?: string;
}

interface MatchListProps {
  matches: Match[];
  selectedMatches: string[];
  onMatchSelect: (matchId: string) => void;
}

const MatchListItem = memo(({ match, isSelected, onSelect }: { 
  match: Match; 
  isSelected: boolean; 
  onSelect: () => void 
}) => {
  return (
    <Card
      key={match.id}
      className="p-4 backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-all duration-300 border-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{match.time}</span>
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {match.tournament}
          </Badge>
        </div>
      </div>
    </Card>
  );
});

MatchListItem.displayName = 'MatchListItem';

export const MatchList = memo(({ matches, selectedMatches, onMatchSelect }: MatchListProps) => {
  // Group matches by date and tournament using memoization
  const matchesByDateAndTournament = useMemo(() => {
    const grouped: Record<string, Record<string, Match[]>> = {};
    
    matches.forEach(match => {
      // Extract date from match.date or use today as fallback
      let dateKey;
      if (match.date) {
        const matchDate = new Date(match.date);
        dateKey = matchDate.toDateString();
      } else {
        // For matches without date, group by "today"
        dateKey = new Date().toDateString();
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      
      if (!grouped[dateKey][match.tournament]) {
        grouped[dateKey][match.tournament] = [];
      }
      
      grouped[dateKey][match.tournament].push(match);
    });
    
    // Sort matches within each tournament by time
    Object.keys(grouped).forEach(dateKey => {
      Object.keys(grouped[dateKey]).forEach(tournament => {
        grouped[dateKey][tournament].sort((a, b) => {
          // If both have dates, sort by actual datetime
          if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          
          // Fallback to time comparison
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          const minutesA = timeA[0] * 60 + timeA[1];
          const minutesB = timeB[0] * 60 + timeB[1];
          
          return minutesA - minutesB;
        });
      });
    });
    
    return grouped;
  }, [matches]);

  // Sort dates chronologically
  const sortedDates = useMemo(() => {
    return Object.keys(matchesByDateAndTournament).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [matchesByDateAndTournament]);

  // Track expanded state for each tournament within each date
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = useCallback((key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleMatchSelect = useCallback((matchId: string) => {
    onMatchSelect(matchId);
  }, [onMatchSelect]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {sortedDates.map((dateKey, dateIndex) => (
        <div key={dateKey} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-white">
              {formatDateHeader(dateKey)}
            </h3>
            <div className="flex-1">
              <Separator className="bg-white/20" />
            </div>
          </div>
          
          {/* Tournaments for this date */}
          <div className="space-y-3 pl-4">
            {Object.entries(matchesByDateAndTournament[dateKey]).map(([tournament, tournamentMatches]) => {
              const itemKey = `${dateKey}-${tournament}`;
              const isExpanded = expandedItems[itemKey] ?? false;
              
              return (
                <div key={itemKey} className="space-y-2">
                  <button
                    onClick={() => toggleItem(itemKey)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Trophy className="w-4 h-4" />
                      <span className="font-medium">{tournament}</span>
                      <Badge variant="outline" className="ml-2">
                        {tournamentMatches.length} matches
                      </Badge>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pl-6">
                      {tournamentMatches.map((match) => (
                        <MatchListItem 
                          key={match.id}
                          match={match}
                          isSelected={selectedMatches.includes(match.id)}
                          onSelect={() => handleMatchSelect(match.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Add separator between dates (except for the last one) */}
          {dateIndex < sortedDates.length - 1 && (
            <div className="py-2">
              <Separator className="bg-white/10" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

MatchList.displayName = 'MatchList';
