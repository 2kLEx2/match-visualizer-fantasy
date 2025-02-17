
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
}

export async function getUpcomingMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  return transformMatchesData(data);
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
      timeZone: 'Europe/Paris', // This sets the time to Central European Time
      hour12: false // Use 24-hour format which is more common in Europe
    }),
    tournament: match.tournament,
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
        // Fetch the latest matches when any change occurs
        const matches = await getUpcomingMatches();
        callback(matches);
      }
    )
    .subscribe();
}
