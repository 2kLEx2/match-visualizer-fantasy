
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
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${graphicRef.offsetWidth}px`;
    container.style.height = `${graphicRef.offsetHeight}px`;
    container.style.backgroundColor = '#000000';
    document.body.appendChild(container);

    // Clone the content
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.transform = 'none';
    container.appendChild(clone);

    // Process images
    const images = clone.getElementsByTagName('img');
    for (const img of Array.from(images)) {
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
            img.src = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('Image processing error:', error);
          img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
      }
    }

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate image
    const options = {
      quality: 1,
      bgcolor: '#000000',
      style: {
        'transform': 'none'
      }
    };

    const dataUrl = await domtoimage.toJpeg(container, options);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'match-graphic.jpg';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    document.body.removeChild(container);
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
