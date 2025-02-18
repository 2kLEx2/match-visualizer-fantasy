
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { MatchGraphic } from './MatchGraphic';
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface CustomizerProps {
  selectedMatches: Match[];
}

interface CustomSettings {
  showLogos: boolean;
  showTime: boolean;
  backgroundColor: string;
  textColor: string;
  scale: number;
}

export const GraphicCustomizer = ({ selectedMatches }: CustomizerProps) => {
  const { toast } = useToast();
  const graphicRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<CustomSettings>({
    showLogos: true,
    showTime: true,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    scale: 100,
  });

  const handleDownload = async () => {
    if (selectedMatches.length === 0) {
      toast({
        title: "No matches selected",
        description: "Please select at least one match to generate a graphic.",
        variant: "destructive",
      });
      return;
    }

    if (graphicRef.current) {
      try {
        const canvas = await html2canvas(graphicRef.current, {
          backgroundColor: settings.backgroundColor,
          scale: 2, // Increase quality
          logging: false,
          useCORS: true,
          allowTaint: true,
          onclone: (clonedDoc) => {
            // Ensure all images are loaded before capture
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
          description: "Your match graphic has been downloaded successfully.",
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

  return (
    <div className="space-y-6">
      <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Display Options</Label>
            <div className="flex items-center justify-between">
              <span>Show Team Logos</span>
              <Switch
                checked={settings.showLogos}
                onCheckedChange={(checked) => setSettings({ ...settings, showLogos: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Show Match Time</span>
              <Switch
                checked={settings.showTime}
                onCheckedChange={(checked) => setSettings({ ...settings, showTime: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colors</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm">Background</span>
                <Input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm">Text</span>
                <Input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => setSettings({ ...settings, textColor: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scale</Label>
            <Slider
              value={[settings.scale]}
              onValueChange={(value) => setSettings({ ...settings, scale: value[0] })}
              min={50}
              max={150}
              step={1}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground">{settings.scale}%</span>
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

      {selectedMatches.length > 0 && (
        <div ref={graphicRef} className="mt-6">
          <MatchGraphic
            matches={selectedMatches}
            settings={settings}
          />
        </div>
      )}
    </div>
  );
};
