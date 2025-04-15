
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PANDASCORE_API_KEY = Deno.env.get('PANDASCORE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface PandaScoreMatch {
  id: number
  begin_at: string
  name: string
  league: {
    name: string
    image_url?: string
  }
  opponents: Array<{
    opponent: {
      name: string
      image_url: string
    }
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a new Supabase client for each request
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public'
        }
      }
    )

    console.log('Starting sync process...')
    
    // Get current date and tomorrow's date
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    // Format dates for PandaScore API
    const fromDate = now.toISOString().split('.')[0] + 'Z'
    const toDate = tomorrow.toISOString().split('.')[0] + 'Z'
    
    console.log(`Fetching matches from: ${fromDate} to: ${toDate}`)
    
    if (!PANDASCORE_API_KEY) {
      throw new Error('PANDASCORE_API_KEY is not set')
    }

    // Construct the URL with proper date range parameters
    const url = new URL('https://api.pandascore.co/csgo/matches/upcoming')
    url.searchParams.append('range[begin_at]', `${fromDate},${toDate}`)
    url.searchParams.append('sort', 'begin_at')
    url.searchParams.append('per_page', '100') // Increased to get more matches
    url.searchParams.append('filter[status]', 'not_started')

    // Fetch upcoming CS:GO matches
    const response = await fetch(
      url.toString(),
      {
        headers: {
          'Authorization': `Bearer ${PANDASCORE_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`PandaScore API error: ${response.status}`, errorText)
      throw new Error(`PandaScore API error: ${response.status} - ${errorText}`)
    }

    const matches: PandaScoreMatch[] = await response.json()
    console.log(`Found ${matches.length} upcoming matches`)

    // Additional logging to debug match data
    matches.forEach(match => {
      console.log(`Match ID: ${match.id}, Name: ${match.name}, Teams: ${
        match.opponents?.map(o => o.opponent?.name || 'unknown').join(' vs ') || 'No opponents'
      }`)
    })

    // Transform matches with better filtering
    const relevantMatches = matches
      .filter(match => {
        const hasOpponents = match.opponents && 
          match.opponents.length >= 2 &&
          match.opponents[0]?.opponent &&
          match.opponents[1]?.opponent
        
        if (!hasOpponents) {
          console.log(`Skipping match ${match.id} due to missing opponents`)
        }
        return hasOpponents
      })
      .map(match => ({
        id: match.id.toString(),
        start_time: match.begin_at,
        team1_name: match.opponents[0]?.opponent.name || 'TBD',
        team1_logo: match.opponents[0]?.opponent.image_url || '/placeholder.svg',
        team2_name: match.opponents[1]?.opponent.name || 'TBD',
        team2_logo: match.opponents[1]?.opponent.image_url || '/placeholder.svg',
        tournament: match.league.name,
        tournament_logo: match.league.image_url || '/placeholder.svg'
      }))

    console.log(`Processing ${relevantMatches.length} relevant matches`)

    // Clean up old matches first
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .lt('start_time', new Date().toISOString())

    if (deleteError) {
      console.error('Error cleaning up old matches:', deleteError)
      throw deleteError
    }

    if (relevantMatches.length > 0) {
      // Upsert new matches
      const { error: upsertError } = await supabase
        .from('matches')
        .upsert(relevantMatches, {
          onConflict: 'id',
          count: 'exact'
        })

      if (upsertError) {
        console.error('Error upserting matches:', upsertError)
        throw upsertError
      }

      console.log(`Successfully synced ${relevantMatches.length} matches`)
    } else {
      console.log('No matches to sync')
    }

    return new Response(
      JSON.stringify({
        success: true,
        matchesSync: relevantMatches.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in sync-matches function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
