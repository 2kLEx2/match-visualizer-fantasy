
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
  subtitle: string;
}

export const GraphicCustomizer = ({ selectedMatches }: CustomizerProps) => {
  const { toast } = useToast();
  const graphicRef = useRef<HTMLDivElement>(null);
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
        const canvas = await html2canvas(graphicRef.current, {
          backgroundColor: '#1a1a1a',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const images = clonedDoc.getElementsByTagName('img');
            Array.from(images).forEach(img => {
              if (!img.complete) {
                img.style.display = 'none';
              }
            });
          }
        });
        
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
    const newEntry: CustomEntry = {
      id: Date.now().toString(),
      time: '',
      title: '',
      subtitle: '',
    };
    setCustomEntries([...customEntries, newEntry]);
  };

  const removeCustomEntry = (id: string) => {
    setCustomEntries(customEntries.filter(entry => entry.id !== id));
  };

  const updateCustomEntry = (id: string, field: keyof CustomEntry, value: string) => {
    setCustomEntries(customEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
        <div className="space-y-6">
          <div className="space-y-4">
            {customEntries.map((entry) => (
              <div 
                key={entry.id}
                className="rounded-md overflow-hidden bg-[#1B2028]/90 transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm"
              >
                <div className="px-3 py-2 grid grid-cols-[70px,1fr,auto] gap-4 items-center">
                  <Input
                    type="text"
                    value={entry.time}
                    onChange={(e) => updateCustomEntry(entry.id, 'time', e.target.value)}
                    placeholder="Time"
                    className="bg-transparent border-0 text-gray-400 p-0 text-base font-medium focus-visible:ring-0"
                  />
                  <div className="space-y-1">
                    <Input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateCustomEntry(entry.id, 'title', e.target.value)}
                      placeholder="Title"
                      className="bg-transparent border-0 text-white p-0 text-base font-medium focus-visible:ring-0"
                    />
                    <Input
                      type="text"
                      value={entry.subtitle}
                      onChange={(e) => updateCustomEntry(entry.id, 'subtitle', e.target.value)}
                      placeholder="Subtitle"
                      className="bg-transparent border-0 text-gray-500 p-0 text-xs uppercase font-medium focus-visible:ring-0"
                    />
                  </div>
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

          <div className="space-y-4">
            <Button
              onClick={addCustomEntry}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Entry
            </Button>

            <Button
              onClick={handleDownload}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Graphic
            </Button>
          </div>
        </div>
      </Card>

      {(selectedMatches.length > 0 || customEntries.length > 0) && (
        <div ref={graphicRef} className="mt-6">
          <MatchGraphic
            matches={selectedMatches}
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
