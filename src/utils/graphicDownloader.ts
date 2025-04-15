
import { Match } from '@/lib/api/matches';
import { supabase } from '@/lib/supabase/client';
import html2canvas from 'html2canvas';

const preloadImages = async (matches: Match[]): Promise<void> => {
  const imageUrls = matches
    .flatMap(match => [match.team1.logo, match.team2.logo])
    .filter(Boolean)
    .map(url => url?.trim())
    .filter(url => url !== '');
  
  await Promise.all(
    imageUrls.map(url => {
      if (!url) return Promise.resolve<void>(undefined);
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Enable CORS
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        img.src = url;
      });
    })
  );
};

export const downloadGraphic = async (
  graphicRef: HTMLDivElement | HTMLCanvasElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    await preloadImages(matches);
    await new Promise(resolve => setTimeout(resolve, 1000));

    let canvas: HTMLCanvasElement;
    
    if (graphicRef instanceof HTMLCanvasElement) {
      // If it's already a canvas, use it directly
      canvas = graphicRef;
    } else {
      // If it's a DOM element, use html2canvas
      canvas = await html2canvas(graphicRef, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        width: 600,
        height: graphicRef.offsetHeight,
        windowWidth: 600,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of images) {
            img.crossOrigin = "anonymous";
          }
          
          const graphics = clonedDoc.querySelectorAll('[data-graphic="true"]');
          graphics.forEach(graphic => {
            graphic.setAttribute('style', 'width: 600px; transform: scale(1); transform-origin: top left;');
          });
        }
      });
    }

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
