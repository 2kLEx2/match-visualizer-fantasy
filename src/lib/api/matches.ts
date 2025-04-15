
import { supabase } from '@/lib/supabase/client';

export interface Match {
  id: string;
  team1: {
    name: string;
    logo: string;
  };
  team2: {
    name: string;
    logo: string;
  };
  time: string;
  tournament: string;
  tournament_logo?: string;
}

// Fetch matches from Supabase database
export async function getUpcomingMatchesFromSupabase(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()) // 48 hours
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching matches from Supabase:', error);
    return [];
  }

  return transformMatchesData(data);
}

// Fetch matches directly from PandaScore API
export async function getUpcomingMatchesFromAPI(): Promise<Match[]> {
  try {
    // Invoke the Supabase Edge Function to fetch matches instead of direct API call
    // This avoids exposing the API key in client-side code
    console.log('Attempting to fetch matches through Supabase function');
    
    const { data, error } = await supabase.functions.invoke('sync-matches');
    
    if (error) {
      console.error('Error invoking sync-matches function:', error);
      return [];
    }
    
    // After syncing matches via the function, fetch the updated matches from the database
    console.log('Successfully synced matches, fetching from database');
    return getUpcomingMatchesFromSupabase();

  } catch (error) {
    console.error('Error fetching matches from API:', error);
    return [];
  }
}

// Main function to get upcoming matches with fallback strategy
export async function getUpcomingMatches(): Promise<Match[]> {
  // Just fetch directly from the database since our sync function handles the API call
  console.log('Fetching matches from database');
  return getUpcomingMatchesFromSupabase();
}

export function transformMatchesData(data: any[]): Match[] {
  return data.map(match => ({
    id: match.id,
    team1: {
      name: match.team1_name,
      logo: match.team1_logo,
    },
    team2: {
      name: match.team2_name,
      logo: match.team2_logo,
    },
    time: new Date(match.start_time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
      hour12: false
    }),
    tournament: match.tournament,
    tournament_logo: match.tournament_logo,
  }));
}

export function subscribeToMatches(callback: (matches: Match[]) => void) {
  return supabase
    .channel('matches-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches'
      },
      async () => {
        const matches = await getUpcomingMatches();
        callback(matches);
      }
    )
    .subscribe();
}
