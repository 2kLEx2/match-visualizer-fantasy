
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    const body = await req.json();
    const url = body.url;
    
    if (!url) {
      throw new Error('URL parameter is required');
    }

    console.log('Proxying image request:', url);

    // Set proper headers for the fetch request
    const proxyHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://pandascore.co/',
      'Origin': 'https://pandascore.co',
      'Cache-Control': 'max-age=0',
    };

    // Fetch the image with proper headers and timeout
    let retryCount = 0;
    const maxRetries = 2;
    let imageResponse = null;
    let error = null;

    while (retryCount <= maxRetries && !imageResponse) {
      try {
        imageResponse = await fetch(url, {
          headers: proxyHeaders,
          signal: AbortSignal.timeout(10000),
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
      } catch (e) {
        error = e;
        retryCount++;
        
        if (retryCount > maxRetries) {
          console.error(`Failed to fetch image after ${maxRetries} retries:`, url);
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!imageResponse || !imageResponse.ok) {
      throw error || new Error('Failed to fetch image after multiple attempts');
    }

    // Convert the image to a data URL
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const arrayBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Return the successful response
    return new Response(JSON.stringify({ 
      imageData: dataUrl,
      success: true,
      contentType: contentType,
      size: uint8Array.length,
      source: url,
      proxy: true,
      retries: retryCount,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      url: error.url
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
