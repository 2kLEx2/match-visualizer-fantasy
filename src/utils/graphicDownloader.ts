
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
    // Process and wait for all images to load first
    const images = graphicRef.getElementsByTagName('img');
    const imageLoadPromises = Array.from(images).map(async (img) => {
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
            return new Promise((resolve, reject) => {
              img.onload = () => resolve(objectUrl);
              img.onerror = reject;
              img.src = objectUrl;
              img.crossOrigin = 'anonymous';
            });
          }
        } catch (error) {
          console.error('Image processing error:', error);
          img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
      }
      return Promise.resolve();
    });

    // Wait for all images to load
    await Promise.all(imageLoadPromises);

    // Additional wait to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture the graphic directly
    const canvas = await html2canvas(graphicRef, {
      backgroundColor: null,
      scale: 2,
      logging: true,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
      removeContainer: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('[data-graphic]') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.transform = 'none';
          clonedElement.style.width = `${graphicRef.offsetWidth}px`;
          clonedElement.style.height = `${graphicRef.offsetHeight}px`;
        }
      }
    });

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob as Blob);
      }, 'image/jpeg', 1.0);
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'match-graphic.jpg';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    imageLoadPromises.forEach(async (promise) => {
      try {
        const objectUrl = await promise;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl as string);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
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
