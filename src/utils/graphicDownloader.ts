
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
    // Pre-load images with CORS proxy
    const images = graphicRef.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map(async (img) => {
        if (img.src.startsWith('https://cdn.pandascore.co')) {
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
            img.src = URL.createObjectURL(blob);
          }
        }
      })
    );

    // Wait for a moment to ensure images are loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create a clone of the element
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    // Generate PNG blob
    const blob = await domtoimage.toBlob(clone, {
      quality: 1,
      bgcolor: '#000000',
      style: {
        'transform': 'none',
        'width': `${graphicRef.offsetWidth}px`,
        'height': `${graphicRef.offsetHeight}px`
      },
      cacheBust: true, // Add cache busting
      imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // Fallback for failed images
    });

    // Remove clone
    document.body.removeChild(clone);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'match-graphic.png';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onSuccess();
    return true;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
