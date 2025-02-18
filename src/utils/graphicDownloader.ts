
import { Match } from '@/lib/api/matches';
import { supabase } from '@/lib/supabase/client';
import html2canvas from 'html2canvas';

const waitForImages = (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.getElementsByTagName('img'));
  
  return Promise.all(
    images.map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
    })
  ).then(() => void 0);
};

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Wait for all images to load first
    await waitForImages(graphicRef);

    // Then capture the HTML element as a canvas
    const canvas = await html2canvas(graphicRef, {
      backgroundColor: null,
      scale: 2, // Higher quality
      logging: true,
      width: 600, // Fixed width
      height: graphicRef.offsetHeight, // Dynamic height based on content
      windowWidth: 600, // Ensure consistent rendering
      useCORS: true, // Enable cross-origin image loading
      allowTaint: true, // Allow cross-origin images
      foreignObjectRendering: true, // Better handling of external content
    });

    // Convert canvas to base64 PNG
    const base64Image = canvas.toDataURL('image/png');

    // Call the render-graphic function with the base64 image
    const { data, error } = await supabase.functions.invoke('render-graphic', {
      body: { 
        matches,
        settings: {
          showLogos: true,
          showTime: true,
          backgroundColor: '#1a1b1e',
          textColor: 'white'
        },
        imageData: base64Image
      }
    });

    if (error) throw error;
    if (!data?.image) throw new Error('No image data received');

    // Create blob from base64 data
    const response = await fetch(`data:image/png;base64,${data.image}`);
    const blob = await response.blob();

    // Create download link
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
