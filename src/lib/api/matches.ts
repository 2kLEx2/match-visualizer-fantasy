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
  date?: string; // Add date field for proper sorting
}

// Fetch matches from Supabase database
export async function getUpcomingMatchesFromSupabase(): Promise<Match[]> {
  console.log('Fetching matches from Supabase database');
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

// Fetch matches directly from PandaScore API via Supabase Edge Function
export async function getUpcomingMatchesFromAPI(): Promise<Match[]> {
  try {
    console.log('Attempting to sync matches through Supabase function');
    
    const { data, error } = await supabase.functions.invoke('sync-matches');
    
    if (error) {
      console.error('Error invoking sync-matches function:', error);
      return [];
    }
    
    // After syncing matches via the function, fetch the updated matches from the database
    console.log('Successfully synced matches, now fetching from database');
    return getUpcomingMatchesFromSupabase();

  } catch (error) {
    console.error('Error syncing matches from API:', error);
    return [];
  }
}

// Main function to get upcoming matches
export async function getUpcomingMatches(): Promise<Match[]> {
  // Force a refresh from the API to ensure we have the latest data
  console.log('Getting upcoming matches with forced API refresh');
  try {
    // Try to get matches from API first (which will sync the database)
    const matches = await getUpcomingMatchesFromAPI();
    return matches;
  } catch (error) {
    console.error('Error in API fetch, falling back to database:', error);
    // Fallback to database if API fails
    return getUpcomingMatchesFromSupabase();
  }
}

// Manually clean up old matches from the database
export async function cleanupOldMatches(): Promise<void> {
  console.log('Manually cleaning up old matches');
  try {
    const { error } = await supabase
      .from('matches')
      .delete()
      .lt('start_time', new Date().toISOString());
    
    if (error) {
      console.error('Error cleaning up old matches:', error);
    } else {
      console.log('Successfully cleaned up old matches');
    }
  } catch (error) {
    console.error('Exception during match cleanup:', error);
  }
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
    date: match.start_time, // Include the full date for proper sorting
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
        const matches = await getUpcomingMatchesFromSupabase();
        callback(matches);
      }
    )
    .subscribe();
}
