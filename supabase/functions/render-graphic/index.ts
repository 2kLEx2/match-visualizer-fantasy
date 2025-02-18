
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
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
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

    // Create canvas with proper dimensions and padding
    const padding = 40;
    const matchHeight = 100;
    const canvas = createCanvas(800, Math.max(400, padding * 2 + matches.length * matchHeight));
    const ctx = canvas.getContext('2d');

    // Set gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1b1e');
    gradient.addColorStop(1, '#161719');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern overlay
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < canvas.width; i += 4) {
      for (let j = 0; j < canvas.height; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Draw header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WATCHPARTY', canvas.width / 2, padding + 20);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#9b87f5';
    ctx.fillText('SCHEDULE', canvas.width / 2, padding + 50);

    // Draw decorative line
    const lineY = padding + 70;
    ctx.beginPath();
    ctx.moveTo(padding, lineY);
    ctx.lineTo(canvas.width - padding, lineY);
    ctx.strokeStyle = '#9b87f5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const y = padding + 120 + i * matchHeight;
      
      // Draw match container
      ctx.fillStyle = '#222327';
      ctx.globalAlpha = 0.95;
      roundedRect(ctx, padding, y - 30, canvas.width - padding * 2, 80, 12);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Add highlight effect
      const highlightGradient = ctx.createLinearGradient(0, y - 30, 0, y + 50);
      highlightGradient.addColorStop(0, 'rgba(155, 135, 245, 0.1)');
      highlightGradient.addColorStop(1, 'rgba(155, 135, 245, 0)');
      ctx.fillStyle = highlightGradient;
      roundedRect(ctx, padding, y - 30, canvas.width - padding * 2, 80, 12);
      ctx.fill();

      // Draw time
      if (settings.showTime && match.time) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#9b87f5';
        ctx.textAlign = 'left';
        ctx.fillText(match.time, padding + 20, y + 15);
      }

      // Calculate positions
      const timeWidth = 100;
      const teamSection = canvas.width - padding * 2 - timeWidth - 200;
      const team1X = padding + timeWidth;
      const team2X = team1X + teamSection / 2 + 50;

      // Draw team names
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';

      // Team 1
      if (settings.showLogos && match.team1.logo) {
        try {
          const logo1 = await loadImage(match.team1.logo);
          ctx.drawImage(logo1, team1X, y - 15, 30, 30);
          ctx.fillText(match.team1.name, team1X + 40, y + 15);
        } catch (error) {
          console.error(`Error loading team1 logo:`, error);
          ctx.fillText(match.team1.name, team1X, y + 15);
        }
      } else {
        ctx.fillText(match.team1.name, team1X, y + 15);
      }

      // VS
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText('VS', canvas.width / 2, y + 15);

      // Team 2
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      
      if (settings.showLogos && match.team2.logo) {
        try {
          const logo2 = await loadImage(match.team2.logo);
          ctx.drawImage(logo2, team2X, y - 15, 30, 30);
          ctx.fillText(match.team2.name, team2X + 40, y + 15);
        } catch (error) {
          console.error(`Error loading team2 logo:`, error);
          ctx.fillText(match.team2.name, team2X, y + 15);
        }
      } else {
        ctx.fillText(match.team2.name, team2X, y + 15);
      }

      // Draw tournament name
      if (match.tournament) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#9b87f5';
        ctx.textAlign = 'right';
        ctx.fillText(match.tournament.toUpperCase(), canvas.width - padding - 20, y + 15);
      }
    }

    try {
      const pngData = canvas.toBuffer();
      console.log('Generated PNG buffer size:', pngData.length);
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
