// Importing serve from Deno standard library
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Start the Deno HTTP server
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Ensure the request method is POST or GET
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request JSON body
    const { url } = await req.json();
    if (!url) {
      throw new Error('URL parameter is required');
    }

    console.log('Proxying image request:', url);

    // Fetch the image from the provided URL
    const imageResponse = await fetch(url);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    // Convert the image to Base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Create the Base64 data URL
    const imageData = `data:${contentType};base64,${base64}`;

    // Return the Base64 encoded image as JSON
    return new Response(JSON.stringify({ 
      imageData,
      success: true 
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
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
    );
  }
});
