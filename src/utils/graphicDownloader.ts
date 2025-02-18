
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Wait for next frame to ensure all content is rendered
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Clone the element to preserve styles
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.transform = 'none'; // Remove any transforms that might affect rendering
    clone.style.width = `${graphicRef.offsetWidth}px`;
    clone.style.height = `${graphicRef.offsetHeight}px`;
    document.body.appendChild(clone);

    // Configure html2canvas options for better quality
    const canvas = await html2canvas(clone, {
      scale: 2, // Increase resolution
      useCORS: true, // Enable cross-origin image loading
      backgroundColor: '#000000', // Match the dark background
      logging: true, // Enable logging for debugging
      allowTaint: true, // Allow cross-origin images
      foreignObjectRendering: true, // Enable foreignObject rendering
      width: graphicRef.offsetWidth,
      height: graphicRef.offsetHeight,
      scrollX: 0,
      scrollY: 0,
    });

    // Remove the clone after capturing
    document.body.removeChild(clone);

    // Convert to PNG and download
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'match-graphic.png';
    link.href = pngUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onSuccess();
    return true;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
