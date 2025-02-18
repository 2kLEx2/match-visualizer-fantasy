
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response('Missing URL parameter', { 
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('Proxying image:', url);

    // Add authorization headers if needed for Pandascore
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    };

    const imageResponse = await fetch(url, { headers });
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return new Response('Failed to fetch image', { 
        status: imageResponse.status,
        headers: corsHeaders
      });
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type');

    console.log('Successfully proxied image:', url);

    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in proxy-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
})
