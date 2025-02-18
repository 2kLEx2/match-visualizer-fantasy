
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { html, css } = await req.json()

    // Launch browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox']
    })
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

    // Wait for images to load
    await page.evaluate(() => Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve
        }))
    ))

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true
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
