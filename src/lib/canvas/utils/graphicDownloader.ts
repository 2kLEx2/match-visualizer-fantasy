import type { Match } from '../types';
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
  onError: (error: Error) => void,
  renderFunction?: (data: any) => Promise<any> // Optional external render function
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
      // If it's already a canvas, use it directly without scaling
      canvas = document.createElement('canvas');
      canvas.width = graphicRef.width;
      canvas.height = graphicRef.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(graphicRef, 0, 0, graphicRef.width, graphicRef.height);
      }
    } else {
      console.log('Using html2canvas to capture DOM element');
      
      // Find the canvas within the graphicRef
      const existingCanvas = graphicRef.querySelector('canvas');
      if (!existingCanvas) {
        throw new Error('Canvas element not found');
      }
      
      // Use the exact dimensions of the existing canvas
      const width = existingCanvas.width;
      const height = existingCanvas.height;
      
      console.log(`Canvas dimensions: ${width}x${height}`);
      
      // Use html2canvas with the proper dimensions to match the canvas
      canvas = await html2canvas(graphicRef, {
        backgroundColor: null,
        scale: 1, // Use a consistent scale
        logging: true, // Enable detailed logging
        width: width,
        height: height,
        windowWidth: width,
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
            graphic.setAttribute('style', `width: ${width}px; transform: scale(1); transform-origin: top left;`);
          });
          
          // Make sure the canvas scale is reset to 1 for consistent output
          const canvasElement = clonedDoc.querySelector('canvas');
          if (canvasElement) {
            canvasElement.style.transform = 'scale(1)';
          }
        }
      });
    }

    console.log('Canvas created, converting to data URL');
    
    // Convert canvas to base64 PNG
    const base64Image = canvas.toDataURL('image/png');
    
    if (renderFunction) {
      console.log('Using external render function');
      
      // Call the external render function
      const result = await renderFunction({
        matches,
        settings: {
          showLogos: true,
          showTime: true,
          backgroundColor: '#1a1b1e',
          textColor: 'white'
        },
        imageData: base64Image
      });

      if (!result?.image) {
        throw new Error('No image data received from render function');
      }

      // Create blob from base64 data
      const response = await fetch(`data:image/png;base64,${result.image}`);
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
    } else {
      // Direct download without external rendering
      console.log('Direct download without external rendering');
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob from canvas');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'match-graphic.png';
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    }

    console.log('Download completed successfully');
    onSuccess();
    return true;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};