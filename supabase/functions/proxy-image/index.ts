
// Correct import for Deno serve
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('Proxying image:', url)

    const imageResponse = await fetch(url)

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    // Get the image data
    const arrayBuffer = await imageResponse.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const contentType = imageResponse.headers.get('content-type') || 'image/png'
    
    // Return the base64 encoded image data with proper data URL format
    const imageData = `data:${contentType};base64,${base64}`

    // Return as JSON with the full data URL
    return new Response(JSON.stringify({ 
      imageData,
      success: true 
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
