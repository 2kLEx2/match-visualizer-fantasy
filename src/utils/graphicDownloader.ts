
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
    // Create a temporary container for the screenshot
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${graphicRef.offsetWidth}px`;
    container.style.height = `${graphicRef.offsetHeight}px`;
    document.body.appendChild(container);

    // Clone the graphic content
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.transform = 'none';
    clone.style.width = `${graphicRef.offsetWidth}px`;
    clone.style.height = `${graphicRef.offsetHeight}px`;
    container.appendChild(clone);

    // Handle image loading
    const images = clone.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map(async (img) => {
        if (img.src.startsWith('https://cdn.pandascore.co')) {
          try {
            const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(img.src)}`;
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
              
              // Create a new image and wait for it to load
              const newImg = new Image();
              newImg.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                newImg.onload = resolve;
                newImg.onerror = reject;
                newImg.src = objectUrl;
              });
              
              // Replace the original image
              img.src = objectUrl;
              img.crossOrigin = 'anonymous';
            }
          } catch (error) {
            console.error('Error loading image:', error);
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          }
        }
      })
    );

    // Wait for any transitions or animations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Capture the screenshot
      const dataUrl = await domtoimage.toPng(container, {
        quality: 1,
        bgcolor: '#000000',
        cacheBust: true,
        style: {
          'transform': 'none'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'match-graphic.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      document.body.removeChild(container);
      Array.from(images).forEach(img => {
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }
      });

      onSuccess();
      return true;
    } catch (screenshotError) {
      console.error('Screenshot generation error:', screenshotError);
      throw screenshotError;
    }
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
