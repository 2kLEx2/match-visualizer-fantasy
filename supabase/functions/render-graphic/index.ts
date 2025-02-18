
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
  startTime: string;
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

    // Create canvas with proper dimensions
    const canvas = createCanvas(600, 200 + matches.length * 80);
    const ctx = canvas.getContext('2d');

    // Load and draw background image
    const bgImage = await loadImage('https://i.imgur.com/tYDGmvR.png');
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Add semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set background color
    ctx.fillStyle = '#1a1b1e';
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Draw title
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText('Watchparty Schedule', canvas.width - 20, 40);

    // Draw matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const y = 100 + i * 80;

      // Draw team names
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'white';
      
      const vs = ' vs ';
      const team1Width = ctx.measureText(match.team1.name).width;
      const vsWidth = ctx.measureText(vs).width;
      
      ctx.fillText(match.team1.name, 20, y);
      ctx.fillText(vs, 20 + team1Width, y);
      ctx.fillText(match.team2.name, 20 + team1Width + vsWidth, y);

      // Draw time if enabled
      if (settings.showTime) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ca3af';
        const time = new Date(match.startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        ctx.fillText(time, canvas.width - 20, y);
      }

      // Draw team logos if enabled
      if (settings.showLogos && (match.team1.logo || match.team2.logo)) {
        const logoSize = 30;
        const logoY = y - 25;

        if (match.team1.logo) {
          try {
            const logo1 = await loadImage(match.team1.logo);
            ctx.drawImage(logo1, 20, logoY, logoSize, logoSize);
          } catch (error) {
            console.error('Error loading team1 logo:', error);
          }
        }

        if (match.team2.logo) {
          try {
            const logo2 = await loadImage(match.team2.logo);
            ctx.drawImage(logo2, 20 + team1Width + vsWidth, logoY, logoSize, logoSize);
          } catch (error) {
            console.error('Error loading team2 logo:', error);
          }
        }
      }
    }

    // Convert canvas to PNG buffer and encode as base64
    const pngData = canvas.toBuffer('image/png');
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(pngData)));

    // Return base64 encoded string
    return new Response(JSON.stringify({ image: base64Data }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
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
