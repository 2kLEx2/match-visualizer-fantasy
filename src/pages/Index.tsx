
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MatchList } from '@/components/MatchList';
import { GraphicCustomizer } from '@/components/GraphicCustomizer';
import { Badge } from '@/components/ui/badge';
import { getUpcomingMatches, subscribeToMatches, Match } from '@/lib/api/matches';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, RefreshCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';

const Index = () => {
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, error, refetch } = useQuery({
    queryKey: ['matches'],
    queryFn: getUpcomingMatches,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = subscribeToMatches((updatedMatches) => {
      queryClient.setQueryData(['matches'], updatedMatches);
      toast({
        title: "Matches Updated",
        description: "The matches list has been updated with the latest data.",
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Refreshing Matches",
      description: "Fetching the latest matches data...",
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-matches');
      
      if (error) throw error;
      
      await refetch();
      
      toast({
        title: "Sync Successful",
        description: `Successfully synced ${data?.matchesSync || 0} matches`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync matches. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Convert selected match IDs to actual Match objects
  const selectedMatchObjects = matches?.filter(match => 
    selectedMatches.includes(match.id)
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container py-8 px-4 mx-auto">
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">CS Match Graphics</h1>
            <p className="text-gray-400">Create beautiful graphics for upcoming matches</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-8 gap-8">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Matches</h2>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Matches'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Next 24 Hours
                  </Badge>
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full bg-white/5" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400">Error loading matches. Please try again later.</div>
              ) : matches && matches.length > 0 ? (
                <MatchList
                  matches={matches}
                  selectedMatches={selectedMatches}
                  onMatchSelect={handleMatchSelect}
                />
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No upcoming matches in the next 24 hours
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">Customize Graphic</h2>
              <GraphicCustomizer
                selectedMatches={selectedMatchObjects}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
