
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PANDASCORE_API_KEY = Deno.env.get('PANDASCORE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Create a Supabase client with the service role key
const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface PandaScoreMatch {
  id: number
  begin_at: string
  name: string
  league: {
    name: string
  }
  opponents: Array<{
    opponent: {
      name: string
      image_url: string
    }
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting sync process...')
    
    // Get current date in ISO format for the range parameter
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const range = `begin_at=timestamp,${now.toISOString()},${tomorrow.toISOString()}`
    
    console.log(`Fetching matches from PandaScore for range: ${range}`)
    
    // Fetch upcoming CS:GO matches with improved parameters
    const response = await fetch(
      `https://api.pandascore.co/csgo/matches/upcoming?${range}&sort=begin_at&per_page=50&status=not_started`,
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
        tournament: match.league.name
      }))

    console.log(`Processing ${relevantMatches.length} relevant matches`)

    // Clean up old matches
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
          onConflict: 'id'
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
    console.error('Error syncing matches:', error)
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
