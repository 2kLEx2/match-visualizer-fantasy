
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    console.log('Proxying image:', imageUrl)

    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText)
      return new Response('Failed to fetch image', { status: imageResponse.status })
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type')

    console.log('Successfully proxied image:', imageUrl)

    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error in proxy-image function:', error)
    return new Response(error.message, { status: 500 })
  }
})
