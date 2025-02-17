
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUpcomingMatches, subscribeToMatches } from '@/lib/api/matches';
import { Shield, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery({
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

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#9b87f5] to-[#D6BCFA] bg-clip-text text-transparent">
              Upcoming Matches
            </h1>
            <p className="text-[#9b87f5]/60 mt-2">
              Next 24 hours schedule
            </p>
          </div>
          <Trophy className="w-8 h-8 text-[#9b87f5]" />
        </div>

        {/* Matches Grid */}
        <div className="grid gap-4">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="h-24 bg-[#2A2F3C] rounded-xl animate-pulse"
              />
            ))
          ) : matches && matches.length > 0 ? (
            matches.map((match) => (
              <div
                key={match.id}
                className="relative overflow-hidden group"
              >
                <div className="bg-gradient-to-r from-[#2A2F3C] to-[#353B4A] rounded-xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg border border-[#9b87f5]/10">
                  <div className="flex items-center justify-between">
                    {/* Team 1 */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-[#9b87f5]/10 flex items-center justify-center border border-[#9b87f5]/20">
                        <Shield className="w-6 h-6 text-[#9b87f5]" />
                      </div>
                      <span className="text-xl font-semibold tracking-tight">
                        {match.team1.name}
                      </span>
                    </div>

                    {/* Match Info */}
                    <div className="flex flex-col items-center mx-4">
                      <span className="text-lg font-bold text-[#9b87f5]">VS</span>
                      <span className="text-sm text-[#9b87f5]/60 mt-1">
                        {match.time}
                      </span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-semibold tracking-tight">
                        {match.team2.name}
                      </span>
                      <div className="w-12 h-12 rounded-full bg-[#9b87f5]/10 flex items-center justify-center border border-[#9b87f5]/20">
                        <Shield className="w-6 h-6 text-[#9b87f5]" />
                      </div>
                    </div>
                  </div>

                  {/* Tournament Name */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#9b87f5]/10 text-[#9b87f5] text-sm">
                    {match.tournament}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#9b87f5]/60">
              No upcoming matches in the next 24 hours
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
