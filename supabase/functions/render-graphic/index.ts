
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
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
}

interface RenderRequest {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matches, settings } = await req.json() as RenderRequest;
    console.log('Received request with matches:', matches.length);

    // Create canvas with proper dimensions
    const canvas = createCanvas(600, 200 + matches.length * 80);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = settings.textColor;
    ctx.textAlign = 'right';
    ctx.fillText('Watchparty Schedule', canvas.width - 20, 40);

    // Draw matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const y = 100 + i * 80;
      console.log(`Drawing match ${i + 1}:`, match.team1.name, 'vs', match.team2.name);

      // Draw team names
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = settings.textColor;
      
      const vs = ' vs ';
      const team1Width = ctx.measureText(match.team1.name).width;
      const vsWidth = ctx.measureText(vs).width;
      
      ctx.fillText(match.team1.name, 20, y);
      ctx.fillText(vs, 20 + team1Width, y);
      ctx.fillText(match.team2.name, 20 + team1Width + vsWidth, y);

      // Draw time if enabled
      if (settings.showTime && match.time) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(match.time, canvas.width - 20, y);
      }

      // Draw team logos if enabled
      if (settings.showLogos) {
        const logoSize = 30;
        const logoY = y - 25;

        if (match.team1.logo) {
          try {
            const logo1 = await loadImage(match.team1.logo);
            ctx.drawImage(logo1, 20, logoY, logoSize, logoSize);
          } catch (error) {
            console.error(`Error loading team1 logo for ${match.team1.name}:`, error);
          }
        }

        if (match.team2.logo) {
          try {
            const logo2 = await loadImage(match.team2.logo);
            ctx.drawImage(logo2, 20 + team1Width + vsWidth, logoY, logoSize, logoSize);
          } catch (error) {
            console.error(`Error loading team2 logo for ${match.team2.name}:`, error);
          }
        }
      }
    }

    try {
      // Get PNG data as Uint8Array
      const pngData = canvas.toBuffer();
      console.log('Generated PNG buffer size:', pngData.length);

      // Convert to base64 string
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pngData)));
      console.log('Successfully encoded image to base64');

      return new Response(JSON.stringify({ image: base64Data }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in image conversion:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
