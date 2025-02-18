
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
  tournament?: string;
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

// Helper function to draw rounded rectangle
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matches, settings } = await req.json() as RenderRequest;
    console.log('Received request with matches:', matches.length);

    // Create canvas with proper dimensions
    const canvas = createCanvas(600, Math.max(300, 120 + matches.length * 80));
    const ctx = canvas.getContext('2d');

    // Set dark background
    ctx.fillStyle = '#1a1b1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Watchparty Schedule', 20, 50);

    // Draw matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const y = 120 + i * 80;
      console.log(`Drawing match ${i + 1}:`, match.team1.name, 'vs', match.team2.name);

      // Draw match container with rounded corners
      ctx.fillStyle = '#1B2028';
      ctx.globalAlpha = 0.9;
      roundedRect(ctx, 10, y - 35, canvas.width - 20, 60, 8);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw time if enabled
      if (settings.showTime && match.time) {
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(match.time, 30, y + 5);
      }

      const timeWidth = 80;
      const matchInfoX = timeWidth + 30;

      // Draw team names and VS
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      
      const team1X = matchInfoX;
      const vsX = team1X + ctx.measureText(match.team1.name).width + 20;
      const team2X = vsX + 40;

      // Draw team1 name and logo
      if (settings.showLogos && match.team1.logo) {
        try {
          const logo1 = await loadImage(match.team1.logo);
          ctx.drawImage(logo1, team1X, y - 15, 24, 24);
          ctx.fillText(match.team1.name, team1X + 34, y + 5);
        } catch (error) {
          console.error(`Error loading team1 logo for ${match.team1.name}:`, error);
          ctx.fillText(match.team1.name, team1X, y + 5);
        }
      } else {
        ctx.fillText(match.team1.name, team1X, y + 5);
      }

      // Draw VS
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText('vs', vsX, y + 5);

      // Draw team2 name and logo
      if (settings.showLogos && match.team2.logo) {
        try {
          const logo2 = await loadImage(match.team2.logo);
          ctx.drawImage(logo2, team2X, y - 15, 24, 24);
          ctx.fillText(match.team2.name, team2X + 34, y + 5);
        } catch (error) {
          console.error(`Error loading team2 logo for ${match.team2.name}:`, error);
          ctx.fillText(match.team2.name, team2X, y + 5);
        }
      } else {
        ctx.fillText(match.team2.name, team2X, y + 5);
      }

      // Draw tournament name
      if (match.tournament) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'right';
        ctx.fillText(match.tournament.toUpperCase(), canvas.width - 30, y + 5);
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
