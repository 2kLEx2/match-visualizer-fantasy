import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CanvasMatchGraphic } from './CanvasMatchGraphic';
import { Match } from '@/lib/api/matches';
import { Download, Copy, CopyCheck } from 'lucide-react';
import { CustomEntryForm } from './CustomEntryForm';
import { CustomEntriesList } from './CustomEntriesList';
import { Input } from '@/components/ui/input';
import { downloadGraphic } from '@/utils/graphicDownloader';
import { HighlightMatchSelector } from './HighlightMatchSelector';

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
  const [isCopying, setIsCopying] = useState(false);
  const [graphicScale, setGraphicScale] = useState(100);
  const [customTitle, setCustomTitle] = useState("Watchparty Schedule");
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(false);

  const copyToClipboard = async () => {
    if (!graphicRef.current) {
      toast({
        title: "Error",
        description: "Could not find the graphic element to copy.",
        variant: "destructive",
      });
      return;
    }

    setIsCopying(true);
    try {
      const canvas = graphicRef.current.querySelector('canvas');
      if (!canvas) throw new Error('Canvas not found');

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      setIsCopying(false);
      toast({
        title: "Success",
        description: "Graphic copied to clipboard!",
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Error",
        description: "Failed to copy the graphic. Please try again.",
        variant: "destructive",
      });
      setIsCopying(false);
    }
  };

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
      setGraphicScale(100);
      
      await new Promise((resolve) => setTimeout(resolve, 100));

      const customMatches: Match[] = customEntries.map(entry => ({
        id: entry.id,
        time: entry.time,
        team1: { name: entry.title, logo: '' },
        team2: { name: '', logo: '' },
        tournament: '',
        date: new Date().toISOString(),
        isCustomEntry: true,
      }));

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!graphicRef.current) return;
    
    const canvas = graphicRef.current.querySelector('canvas');
    if (!canvas) return;

    e.dataTransfer.setData('text/plain', 'graphic');
    e.dataTransfer.effectAllowed = 'copy';

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCanvas.width = canvas.width / 4;
      tempCanvas.height = canvas.height / 4;
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      e.dataTransfer.setDragImage(tempCanvas, tempCanvas.width / 2, tempCanvas.height / 2);
    }
  };

  const customMatches: Match[] = customEntries.map(entry => ({
    id: entry.id,
    time: entry.time,
    team1: { name: entry.title, logo: '' },
    team2: { name: '', logo: '' },
    tournament: '',
    date: new Date().toISOString(),
    isCustomEntry: true,
  }));

  const allMatches = [...selectedMatches, ...customMatches].sort((a, b) => {
    const timeA = parseInt(a.time.replace(':', ''));
    const timeB = parseInt(b.time.replace(':', ''));
    return timeA - timeB;
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-200">
              Graphic Title
            </label>
            <Input
              id="title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Enter custom title"
              className="bg-white/5 border-0 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-4">
            <HighlightMatchSelector 
              matches={selectedMatches}
              highlightedMatchId={highlightedMatchId}
              onHighlightChange={setHighlightedMatchId}
              enabled={isHighlightEnabled}
              onToggle={setIsHighlightEnabled}
            />

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

          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Downloading...' : 'Download Graphic'}
            </Button>
            
            <Button
              onClick={copyToClipboard}
              disabled={isCopying}
              variant="secondary"
              className="flex-1"
            >
              {isCopying ? (
                <CopyCheck className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {isCopying ? 'Copying...' : 'Copy Graphic'}
            </Button>
          </div>
        </div>
      </Card>

      {(allMatches.length > 0) && (
        <div 
          ref={graphicRef}
          draggable
          onDragStart={handleDragStart}
          className="cursor-grab active:cursor-grabbing"
        >
          <CanvasMatchGraphic
            matches={allMatches}
            settings={{
              showLogos: true,
              showTime: true,
              backgroundColor: '#1a1b1e',
              textColor: '#FFFFFF',
              scale: graphicScale,
              title: customTitle,
              highlightedMatchId: isHighlightEnabled ? highlightedMatchId : null,
            }}
            width={1200}
            height={675}
          />
        </div>
      )}
    </div>
  );
};
