
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
    console.log('Starting graphic download process');
    
    // Preload all images first
    await preloadImages(matches);
    console.log('Images preloaded');
    
    // Give a moment for any rendering to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    let canvas: HTMLCanvasElement;
    
    if (graphicRef instanceof HTMLCanvasElement) {
      console.log('Using canvas directly');
      // If it's already a canvas, clone it to get a clean copy
      canvas = document.createElement('canvas');
      canvas.width = graphicRef.width;
      canvas.height = graphicRef.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(graphicRef, 0, 0);
      }
    } else {
      console.log('Using html2canvas to capture DOM element');
      // If it's a DOM element, use html2canvas
      canvas = await html2canvas(graphicRef, {
        backgroundColor: null,
        scale: 2,
        logging: true, // Enable detailed logging
        width: 600,
        height: graphicRef.offsetHeight,
        windowWidth: 600,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          console.log('html2canvas cloning document');
          
          // Force CORS on all images
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of images) {
            img.crossOrigin = "anonymous";
            console.log(`Setting crossOrigin for image: ${img.src}`);
          }
          
          // Ensure graphic containers have proper scaling
          const graphics = clonedDoc.querySelectorAll('[data-graphic="true"]');
          graphics.forEach(graphic => {
            graphic.setAttribute('style', 'width: 600px; transform: scale(1); transform-origin: top left;');
          });
        }
      });
    }

    console.log('Canvas created, converting to data URL');
    
    // Convert canvas to base64 PNG
    const base64Image = canvas.toDataURL('image/png');
    
    console.log('Canvas converted to data URL, calling render-graphic function');

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

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    if (!data?.image) {
      console.error('No image data received from render-graphic function');
      throw new Error('No image data received');
    }
    
    console.log('Image data received from render-graphic function');

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

    console.log('Download completed successfully');
    onSuccess();
    return true;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
