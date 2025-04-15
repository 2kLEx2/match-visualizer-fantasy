
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
    .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
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
    // Get the PandaScore API key from environment variables or config
    // In production, this should come from a secure server-side source
    const apiKey = import.meta.env.VITE_PANDASCORE_API_KEY;
    
    if (!apiKey) {
      console.error('PANDASCORE_API_KEY is not set. Using database matches instead.');
      return [];
    }

    // Current date and tomorrow for filtering
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Format dates for PandaScore API
    const fromDate = now.toISOString().split('.')[0] + 'Z';
    const toDate = tomorrow.toISOString().split('.')[0] + 'Z';
    
    // Construct URL with parameters
    const url = new URL('https://api.pandascore.co/csgo/matches/upcoming');
    url.searchParams.append('range[begin_at]', `${fromDate},${toDate}`);
    url.searchParams.append('sort', 'begin_at');
    url.searchParams.append('per_page', '50');
    url.searchParams.append('filter[status]', 'not_started');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data on each call
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PandaScore API error: ${response.status}`, errorText);
      throw new Error(`PandaScore API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.length} upcoming matches from API`);

    // Transform API data to match our interface
    return data
      .filter((match: any) => {
        const hasOpponents = match.opponents && 
          match.opponents.length >= 2 &&
          match.opponents[0]?.opponent &&
          match.opponents[1]?.opponent;
        
        if (!hasOpponents) {
          console.log(`Skipping match ${match.id} due to missing opponents`);
        }
        return hasOpponents;
      })
      .map((match: any) => ({
        id: match.id.toString(),
        team1: {
          name: match.opponents[0]?.opponent.name || 'TBD',
          logo: match.opponents[0]?.opponent.image_url || '/placeholder.svg',
        },
        team2: {
          name: match.opponents[1]?.opponent.name || 'TBD',
          logo: match.opponents[1]?.opponent.image_url || '/placeholder.svg',
        },
        time: new Date(match.begin_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris',
          hour12: false
        }),
        tournament: match.league.name,
        tournament_logo: match.league.image_url || '/placeholder.svg'
      }));

  } catch (error) {
    console.error('Error fetching matches from API:', error);
    return [];
  }
}

// Main function to get upcoming matches with fallback strategy
export async function getUpcomingMatches(): Promise<Match[]> {
  // Try to fetch from API first for most up-to-date data
  const apiMatches = await getUpcomingMatchesFromAPI();
  
  // If API fetch successful, return those matches
  if (apiMatches.length > 0) {
    console.log('Using matches from direct API fetch');
    return apiMatches;
  }
  
  // Fallback to database if API fails or returns no matches
  console.log('API fetch returned no matches, falling back to database');
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
