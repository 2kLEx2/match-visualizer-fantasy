
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Twitter API credentials from environment variables
const API_KEY = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
const API_SECRET = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
const ACCESS_TOKEN = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
const ACCESS_TOKEN_SECRET = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

interface TwitterShareRequest {
  text: string;
  imageData: string;  // Base64 encoded image data
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");

  return signature;
}

function generateOAuthHeader(method: string, url: string): string {
  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
    throw new Error("Missing Twitter API credentials");
  }

  const oauthParams = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    API_SECRET,
    ACCESS_TOKEN_SECRET
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");
}

async function uploadMedia(imageData: string): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  
  // Convert base64 to binary
  const binaryData = atob(base64Data);
  const bytes = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  const url = "https://upload.twitter.com/1.1/media/upload.json";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, url);
  
  const formData = new FormData();
  const blob = new Blob([bytes], { type: "image/png" });
  formData.append("media", blob, "graphic.png");
  
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Media upload failed:", errorText);
    throw new Error(`Failed to upload media: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return data.media_id_string;
}

async function createTweet(text: string, mediaId: string): Promise<any> {
  const url = "https://api.twitter.com/1.1/statuses/update.json";
  const method = "POST";
  const oauthHeader = generateOAuthHeader(method, url);
  
  const formData = new URLSearchParams();
  formData.append("status", text);
  formData.append("media_ids", mediaId);
  
  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tweet creation failed:", errorText);
    throw new Error(`Failed to create tweet: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
      throw new Error("Twitter API credentials not configured");
    }
    
    const { text, imageData } = await req.json() as TwitterShareRequest;
    
    if (!text || !imageData) {
      throw new Error("Missing required parameters: text and imageData");
    }
    
    // Run the Twitter API calls in the background
    const promise = (async () => {
      try {
        console.log("Uploading media to Twitter...");
        const mediaId = await uploadMedia(imageData);
        console.log("Media uploaded with ID:", mediaId);
        
        console.log("Creating tweet...");
        const tweetResponse = await createTweet(text, mediaId);
        console.log("Tweet created:", tweetResponse.id_str);
      } catch (error) {
        console.error("Background task error:", error);
      }
    })();
    
    // Use waitUntil to run the task in the background
    // so the function won't terminate until completion
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(promise);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Tweet is being processed",
      }),
      {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
