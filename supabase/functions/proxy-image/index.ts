
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const imageUrl = url.searchParams.get('url')

    if (!imageUrl) {
      return new Response('Missing URL parameter', { status: 400 })
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: imageResponse.status })
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type')

    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
})
