
import React from 'react';
import { Match } from '@/lib/api/matches';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface HighlightMatchSelectorProps {
  matches: Match[];
  highlightedMatchId: string | null;
  onHighlightChange: (matchId: string | null) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const HighlightMatchSelector = ({
  matches,
  highlightedMatchId,
  onHighlightChange,
  enabled,
  onToggle,
}: HighlightMatchSelectorProps) => {
  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between">
        <Label htmlFor="highlight-toggle" className="text-sm font-medium text-gray-200">
          Highlight Match
        </Label>
        <Switch
          id="highlight-toggle"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>

      {enabled && (
        <Select
          value={highlightedMatchId || ''}
          onValueChange={(value) => onHighlightChange(value || null)}
        >
          <SelectTrigger className="w-full bg-white/5 border-0">
            <SelectValue placeholder="Select match to highlight" />
          </SelectTrigger>
          <SelectContent>
            {matches.map((match) => (
              <SelectItem key={match.id} value={match.id}>
                {match.team1.name} vs {match.team2.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
