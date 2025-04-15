
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface Team {
  name: string;
  logo?: string;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  time: string;
  tournament?: string;
}

interface RenderRequest {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
    title?: string; // Added title as optional
  };
  imageData: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matches, settings, imageData } = await req.json() as RenderRequest;
    console.log('Received request with matches:', matches.length);

    if (!imageData) {
      throw new Error('No image data provided');
    }

    // Remove the data:image/png;base64, prefix if present
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

    // In a full implementation, we would process the image here
    // For now, we're just returning the image as-is
    return new Response(
      JSON.stringify({ 
        image: base64Data,
        matchesProcessed: matches.length 
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
