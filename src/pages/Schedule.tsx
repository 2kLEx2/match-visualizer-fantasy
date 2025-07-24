import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Match } from '@/lib/api/matches';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<string>('');
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get matches from location state passed from the main page
    const matches = location.state?.matches as Match[];
    
    if (matches && matches.length > 0) {
      // Format matches as requested: "time team1 vs team2 tournament name"
      const formattedMatches = matches.map(match => {
        if ((match as any).isCustomEntry) {
          // Custom entries have the title in team1.name
          return `${match.time} ${match.team1.name}`;
        } else {
          // Regular matches
          return `${match.time} ${match.team1.name} vs ${match.team2.name} ${match.tournament}`;
        }
      });
      
      setScheduleData(formattedMatches.join('\n'));
    } else {
      setScheduleData('No matches selected');
    }
  }, [location.state]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scheduleData);
      toast({
        title: "Copied!",
        description: "Schedule data copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([scheduleData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Schedule saved as text file.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container py-8 px-4 mx-auto max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Saved Schedule</h1>
              <p className="text-gray-400">Raw schedule data for scraping</p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </div>

          <Card className="p-6 backdrop-blur-sm bg-white/10 border-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Raw Schedule Data</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadAsText}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap text-gray-100">
                  {scheduleData || 'No schedule data available'}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;