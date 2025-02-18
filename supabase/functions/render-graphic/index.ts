
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Browser } from 'https://deno.land/x/puppeteer@16.2.0/vendor/puppeteer-core/puppeteer/common/Browser.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { html, css } = await req.json()

    // Create a new Chrome instance
    const browser = await Deno.createBrowser()
    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({
      width: 600,
      height: 800,
      deviceScaleFactor: 2,
    })

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
    `)

    // Wait for all content to load
    await page.waitForLoadState('networkidle')

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
      fullPage: true
    })

    await browser.close()

    return new Response(screenshot, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
      }
    })
  } catch (error) {
    console.error('Screenshot error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
