
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MatchGraphic } from './MatchGraphic';
import { Match } from '@/lib/api/matches';
import { Download } from 'lucide-react';
import { CustomEntryForm } from './CustomEntryForm';
import { CustomEntriesList } from './CustomEntriesList';
import { downloadGraphic } from '@/utils/graphicDownloader';

interface CustomizerProps {
  selectedMatches: Match[];
}

interface CustomEntry {
  id: string;
  time: string;
  title: string;
}

export const GraphicCustomizer = ({ selectedMatches }: CustomizerProps) => {
  const { toast } = useToast();
  const graphicRef = useRef<HTMLDivElement>(null);
  const [newEntry, setNewEntry] = useState<CustomEntry>({
    id: '',
    time: '',
    title: ''
  });
  const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (selectedMatches.length === 0 && customEntries.length === 0) {
      toast({
        title: "No content to display",
        description: "Please select matches or add custom entries to generate a graphic.",
        variant: "destructive",
      });
      return;
    }

    if (!graphicRef.current) {
      toast({
        title: "Error",
        description: "Could not find the graphic element to download.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Convert custom entries to match format
      const customMatches: Match[] = customEntries.map(entry => ({
        id: entry.id,
        time: entry.time,
        team1: { name: entry.title, logo: '' },
        team2: { name: '', logo: '' },
        tournament: '',
        date: new Date().toISOString(),
        isCustomEntry: true,
      }));

      // Combine all matches
      const allMatches = [...selectedMatches, ...customMatches].sort((a, b) => {
        const timeA = parseInt(a.time.replace(':', ''));
        const timeB = parseInt(b.time.replace(':', ''));
        return timeA - timeB;
      });

      await downloadGraphic(
        graphicRef.current,
        allMatches,
        () => {
          toast({
            title: "Success",
            description: "Graphic has been downloaded successfully.",
          });
        },
        (error) => {
          console.error('Download error:', error);
          toast({
            title: "Error",
            description: "Failed to generate the graphic. Please try again.",
            variant: "destructive",
          });
        }
      );
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while downloading the graphic.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const addCustomEntry = () => {
    if (!newEntry.time || !newEntry.title) {
      toast({
        title: "Missing Information",
        description: "Please fill in both time and title fields.",
        variant: "destructive",
      });
      return;
    }

    const entryToAdd = {
      ...newEntry,
      id: Date.now().toString(),
    };
    setCustomEntries([...customEntries, entryToAdd]);
    setNewEntry({ id: '', time: '', title: '' });
    
    toast({
      title: "Entry Added",
      description: "Custom entry has been added to the graphic.",
    });
  };

  const removeCustomEntry = (id: string) => {
    setCustomEntries(customEntries.filter(entry => entry.id !== id));
    toast({
      title: "Entry Removed",
      description: "Custom entry has been removed from the graphic.",
    });
  };

  // Convert custom entries to match format for the graphic
  const customMatches: Match[] = customEntries.map(entry => ({
    id: entry.id,
    time: entry.time,
    team1: { name: entry.title, logo: '' },
    team2: { name: '', logo: '' },
    tournament: '',
    date: new Date().toISOString(),
    isCustomEntry: true,
  }));

  // Combine and sort all matches by time
  const allMatches = [...selectedMatches, ...customMatches].sort((a, b) => {
    const timeA = parseInt(a.time.replace(':', ''));
    const timeB = parseInt(b.time.replace(':', ''));
    return timeA - timeB;
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
        <div className="space-y-6">
          <div className="space-y-4">
            <CustomEntryForm
              newEntry={newEntry}
              onEntryChange={setNewEntry}
              onAddEntry={addCustomEntry}
            />
            <CustomEntriesList
              entries={customEntries}
              onRemoveEntry={removeCustomEntry}
            />
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
            {isDownloading ? 'Downloading...' : 'Download Graphic'}
          </Button>
        </div>
      </Card>

      {(allMatches.length > 0) && (
        <div ref={graphicRef} className="mt-6">
          <MatchGraphic
            matches={allMatches}
            settings={{
              showLogos: true,
              showTime: true,
              backgroundColor: '#1a1a1a',
              textColor: '#ffffff',
              scale: 100,
            }}
          />
        </div>
      )}
    </div>
  );
};
