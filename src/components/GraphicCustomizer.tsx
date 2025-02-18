
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { Match } from '@/lib/api/matches';

interface CustomEntry {
  id: string;
  time: string;
  title: string;
  subtitle: string;
}

interface GraphicCustomizerProps {
  selectedMatches: Match[];
}

export const GraphicCustomizer = ({ selectedMatches }: GraphicCustomizerProps) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<CustomEntry[]>([]);

  const addEntry = () => {
    const newEntry: CustomEntry = {
      id: Date.now().toString(),
      time: '',
      title: '',
      subtitle: '',
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateEntry = (id: string, field: keyof CustomEntry, value: string) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleDownload = async () => {
    if (entries.length === 0 && selectedMatches.length === 0) {
      toast({
        title: "No content to download",
        description: "Please add at least one schedule entry or select a match.",
        variant: "destructive",
      });
      return;
    }

    // Download functionality can be implemented later
    toast({
      title: "Coming Soon",
      description: "Download functionality will be available in the next update.",
    });
  };

  return (
    <div className="space-y-6">
      {selectedMatches.length > 0 && (
        <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Selected Matches</h3>
            {selectedMatches.map((match) => (
              <div 
                key={match.id}
                className="rounded-md overflow-hidden bg-[#1B2028]/90 transition-all duration-300"
              >
                <div className="px-3 py-2 grid grid-cols-[70px,1fr] gap-4 items-center">
                  <div className="text-base font-medium text-gray-400">
                    {match.time}
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-medium text-white">
                      {match.team1.name} vs {match.team2.name}
                    </div>
                    <div className="text-xs uppercase font-medium text-gray-500">
                      {match.tournament}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-white">Custom Schedule</h3>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                className="rounded-md overflow-hidden bg-[#1B2028]/90 transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm"
              >
                <div className="px-3 py-2 grid grid-cols-[70px,1fr,auto] gap-4 items-center">
                  <Input
                    type="text"
                    value={entry.time}
                    onChange={(e) => updateEntry(entry.id, 'time', e.target.value)}
                    placeholder="Time"
                    className="bg-transparent border-0 text-gray-400 p-0 text-base font-medium focus-visible:ring-0"
                  />
                  <div className="space-y-1">
                    <Input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
                      placeholder="Title"
                      className="bg-transparent border-0 text-white p-0 text-base font-medium focus-visible:ring-0"
                    />
                    <Input
                      type="text"
                      value={entry.subtitle}
                      onChange={(e) => updateEntry(entry.id, 'subtitle', e.target.value)}
                      placeholder="Subtitle"
                      className="bg-transparent border-0 text-gray-500 p-0 text-xs uppercase font-medium focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(entry.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Button
              onClick={addEntry}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule Entry
            </Button>

            <Button
              onClick={handleDownload}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={entries.length === 0 && selectedMatches.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Graphic
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
