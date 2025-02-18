
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { MatchGraphic } from './MatchGraphic';
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';
import { Download, Plus, Trash2 } from 'lucide-react';

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

  const handleDownload = async () => {
    if (selectedMatches.length === 0 && customEntries.length === 0) {
      toast({
        title: "No content to display",
        description: "Please select matches or add custom entries to generate a graphic.",
        variant: "destructive",
      });
      return;
    }

    if (graphicRef.current) {
      try {
        // Pre-load all images including logos and background
        const allImages = [
          'https://i.imgur.com/tYDGmvR.png',
          ...selectedMatches.flatMap(match => [match.team1.logo, match.team2.logo]).filter(Boolean)
        ];

        await Promise.all(allImages.map(url => {
          if (!url) return Promise.resolve();
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = resolve;
            img.src = url;
          });
        }));

        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '600px';
        container.style.backgroundColor = '#1a1a1a';
        document.body.appendChild(container);

        // Clone the graphic
        const clone = graphicRef.current.cloneNode(true) as HTMLElement;
        clone.style.transform = 'none';
        container.appendChild(clone);

        // Ensure all images in the clone have crossOrigin set
        const images = clone.getElementsByTagName('img');
        Array.from(images).forEach(img => {
          img.crossOrigin = 'anonymous';
          img.style.imageRendering = 'high-quality';
        });

        // Create canvas with proper settings
        const canvas = await html2canvas(clone, {
          backgroundColor: '#1a1a1a',
          scale: 3, // Increased scale for better quality
          logging: false,
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          imageTimeout: 0,
          removeContainer: true,
          width: 600,
          height: clone.offsetHeight,
        });

        // Clean up
        document.body.removeChild(container);

        // Convert to PNG with proper alpha channel handling
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = 'match-graphic.png';
        link.click();

        toast({
          title: "Graphic Downloaded",
          description: "Your graphic has been downloaded successfully.",
        });
      } catch (error) {
        console.error('Error generating graphic:', error);
        toast({
          title: "Error",
          description: "Failed to generate the graphic. Please try again.",
          variant: "destructive",
        });
      }
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
    setNewEntry({ id: '', time: '', title: '' }); // Reset form
    
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
            <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-end">
              <div>
                <Input
                  type="text"
                  value={newEntry.time}
                  onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                  placeholder="Time (e.g., 19:00)"
                  className="bg-transparent border-white/20"
                />
              </div>
              <div>
                <Input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="Title"
                  className="bg-transparent border-white/20"
                />
              </div>
              <Button
                onClick={addCustomEntry}
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {customEntries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/80">Custom Entries:</h3>
                {customEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="rounded-md overflow-hidden bg-[#1B2028]/90 transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm"
                  >
                    <div className="px-3 py-2 grid grid-cols-[70px,1fr,auto] gap-4 items-center">
                      <span className="text-base font-medium text-gray-400">{entry.time}</span>
                      <span className="text-base font-medium text-white">{entry.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomEntry(entry.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Graphic
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
