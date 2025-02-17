
import { useState } from 'react';
import { MatchList } from '@/components/MatchList';
import { GraphicCustomizer } from '@/components/GraphicCustomizer';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with real API data
const mockMatches = [
  {
    id: '1',
    team1: {
      name: 'NAVI',
      logo: 'https://example.com/navi-logo.png',
    },
    team2: {
      name: 'Vitality',
      logo: 'https://example.com/vitality-logo.png',
    },
    time: '18:00 CET',
    tournament: 'ESL Pro League',
  },
  {
    id: '2',
    team1: {
      name: 'FaZe',
      logo: 'https://example.com/faze-logo.png',
    },
    team2: {
      name: 'G2',
      logo: 'https://example.com/g2-logo.png',
    },
    time: '21:00 CET',
    tournament: 'BLAST Premier',
  },
];

const Index = () => {
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  const handleGenerateGraphic = (settings: any) => {
    // Implement graphic generation logic
    console.log('Generating graphic with settings:', settings);
    console.log('Selected matches:', selectedMatches);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container py-8 px-4 mx-auto">
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">CS Match Graphics</h1>
            <p className="text-gray-400">Create beautiful graphics for upcoming matches</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Matches</h2>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Next 24 Hours
                </Badge>
              </div>
              <MatchList
                matches={mockMatches}
                selectedMatches={selectedMatches}
                onMatchSelect={handleMatchSelect}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Customize Graphic</h2>
              <GraphicCustomizer
                selectedMatches={selectedMatches}
                onGenerateGraphic={handleGenerateGraphic}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
