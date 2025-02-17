
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Fetching matches from PandaScore...')
    
    // Fetch upcoming CS:GO matches from PandaScore
    const response = await fetch(
      'https://api.pandascore.co/csgo/matches/upcoming?per_page=50',
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

    // Transform and filter matches for the next 24 hours
    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const relevantMatches = matches
      .filter(match => new Date(match.begin_at) <= next24Hours)
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

    // Delete existing matches that are more than 24 hours old
    // (We have a trigger that does this, but let's clean up before inserting new ones)
    await supabase
      .from('matches')
      .delete()
      .lt('start_time', new Date().toISOString())

    // Upsert new matches
    const { error } = await supabase
      .from('matches')
      .upsert(relevantMatches, {
        onConflict: 'id'
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, matchesSync: relevantMatches.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error syncing matches:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
