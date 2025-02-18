
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Configure html2canvas options for better quality
    const canvas = await html2canvas(graphicRef, {
      scale: 2, // Increase resolution
      useCORS: true, // Enable cross-origin image loading
      backgroundColor: '#000000', // Match the dark background
      logging: true, // Enable logging for debugging
      allowTaint: true, // Allow cross-origin images
      foreignObjectRendering: true, // Enable foreignObject rendering
    });

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
