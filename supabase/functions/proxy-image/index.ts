
// Importing serve from Deno standard library
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    // Check if the URL is from a known problematic domain that needs special handling
    const isExternalCDN = url.includes('cdn.pandascore.co') || 
                          url.includes('cdn.') || 
                          url.includes('cloudfront.net');

    const fetchOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://supabase.com',
        'Referer': 'https://supabase.com/',
      },
      // Add longer timeout for external CDNs
      signal: AbortSignal.timeout(isExternalCDN ? 10000 : 5000),
    };
    
    // Attempt to fetch with retries for external CDNs
    let imageResponse;
    let retryCount = 0;
    const maxRetries = isExternalCDN ? 2 : 0;
    
    while (retryCount <= maxRetries) {
      try {
        imageResponse = await fetch(url, fetchOptions);
        
        if (imageResponse.ok) {
          break; // Success, exit retry loop
        } else {
          console.log(`Attempt ${retryCount + 1} failed with status ${imageResponse.status}, ${maxRetries - retryCount} retries left`);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Wait with exponential backoff before retry
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
          }
        }
      } catch (fetchError) {
        console.error(`Fetch attempt ${retryCount + 1} error:`, fetchError.message);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
        } else {
          throw new Error(`Failed to fetch image after ${maxRetries + 1} attempts: ${fetchError.message}`);
        }
      }
    }

    if (!imageResponse || !imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse?.statusText || 'Unknown error'} (${imageResponse?.status || 'Unknown status'})`);
    }

    // Get content type
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Get the image as binary data
    const arrayBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create the Base64 representation
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    // Create the Base64 data URL
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Return the Base64 encoded image as JSON with additional CORS headers
    return new Response(JSON.stringify({ 
      imageData: dataUrl,
      success: true,
      contentType: contentType,
      size: uint8Array.length,
      source: url,
      proxy: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
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
