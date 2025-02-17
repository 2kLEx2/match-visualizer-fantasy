
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PANDASCORE_API_KEY = Deno.env.get('PANDASCORE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

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
    console.log('Fetching matches from PandaScore...')
    
    // Get current date in ISO format for the range parameter
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const range = `begin_at=timestamp,${now.toISOString()},${tomorrow.toISOString()}`
    
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
      throw new Error(`PandaScore API error: ${response.status}`)
    }

    const matches: PandaScoreMatch[] = await response.json()
    console.log(`Found ${matches.length} upcoming matches`)

    // Transform matches with better filtering
    const relevantMatches = matches
      .filter(match => 
        match.opponents && 
        match.opponents.length >= 2 &&
        match.opponents[0]?.opponent &&
        match.opponents[1]?.opponent
      )
      .map(match => ({
        id: match.id.toString(),
        start_time: match.begin_at,
        team1_name: match.opponents[0]?.opponent.name || 'TBD',
        team1_logo: match.opponents[0]?.opponent.image_url || '/placeholder.svg',
        team2_name: match.opponents[1]?.opponent.name || 'TBD',
        team2_logo: match.opponents[1]?.opponent.image_url || '/placeholder.svg',
        tournament: match.league.name
      }))

    console.log(`Syncing ${relevantMatches.length} matches to database`)

    // Clean up old matches
    await supabase
      .from('matches')
      .delete()
      .lt('start_time', new Date().toISOString())

    if (relevantMatches.length > 0) {
      // Upsert new matches
      const { error } = await supabase
        .from('matches')
        .upsert(relevantMatches, {
          onConflict: 'id'
        })

      if (error) {
        throw error
      }
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
