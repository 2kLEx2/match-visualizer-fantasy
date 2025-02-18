
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let browser;
  try {
    const { html, css } = await req.json()

    console.log('Launching browser...');
    // Launch browser with explicit path
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    
    console.log('Creating new page...');
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 600,
      height: 800
    });

    console.log('Setting page content...');
    // Inject content
    await page.setContent(`
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body style="margin: 0; background: transparent;">
          ${html}
        </body>
      </html>
    `);

    console.log('Waiting for network idle...');
    // Wait for network activity to settle
    await page.waitForNetworkIdle();

    console.log('Taking screenshot...');
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
      fullPage: true
    });

    console.log('Screenshot taken successfully');
    return new Response(screenshot, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
      }
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
});
