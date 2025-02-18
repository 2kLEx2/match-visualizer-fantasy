
import { Match } from '@/lib/api/matches';
import domtoimage from 'dom-to-image';
import { supabase } from '@/lib/supabase/client';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Create a clone of the element first
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    // Pre-load images with CORS proxy
    const images = clone.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map(async (img) => {
        if (img.src.startsWith('https://cdn.pandascore.co')) {
          try {
            // Use Supabase Edge Function as proxy with API key
            const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(img.src)}`;
            img.crossOrigin = 'anonymous';
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(proxyUrl, {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              img.src = objectUrl;
              // Wait for the image to load
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
              });
            }
          } catch (error) {
            console.error('Error loading image:', error);
            // Replace failed image with placeholder
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          }
        }
      })
    );

    // Wait a moment for any remaining images to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate PNG blob
    const blob = await domtoimage.toBlob(clone, {
      quality: 1,
      bgcolor: '#000000',
      style: {
        'transform': 'none',
        'width': `${graphicRef.offsetWidth}px`,
        'height': `${graphicRef.offsetHeight}px`
      },
      cacheBust: true,
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });

    // Remove clone from DOM
    document.body.removeChild(clone);

    // Create and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'match-graphic.png';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Cleanup any remaining object URLs
    Array.from(images).forEach(img => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    
    onSuccess();
    return true;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
