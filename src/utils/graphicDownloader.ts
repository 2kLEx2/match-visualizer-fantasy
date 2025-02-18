
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase/client';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Process images through proxy first
    const images = graphicRef.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(async (img) => {
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
            await new Promise((resolve, reject) => {
              const newImg = new Image();
              newImg.onload = resolve;
              newImg.onerror = reject;
              newImg.src = objectUrl;
              img.src = objectUrl;
            });
          }
        } catch (error) {
          console.error('Image proxy error:', error);
        }
      }
    });

    // Wait for all images to be processed
    await Promise.all(imagePromises);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate the canvas
    const canvas = await html2canvas(graphicRef, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#1a1b1e',
      onclone: (clonedDoc) => {
        const element = clonedDoc.body.querySelector('[data-graphic]') as HTMLElement;
        if (element) {
          element.style.transform = 'none';
        }
      }
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        reject(error);
      }
    });

    // Download the image
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'match-graphic.png';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
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
