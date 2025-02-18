
import html2canvas from 'html2canvas';
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Wait for a small delay to ensure the DOM is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create canvas with proper settings
    const canvas = await html2canvas(graphicRef, {
      backgroundColor: '#FFFFFF',
      scale: 3,
      logging: true,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
      imageTimeout: 15000,
      width: 600,
      height: graphicRef.offsetHeight,
    });

    // Convert to PNG
    const image = canvas.toDataURL('image/png', 1.0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'match-graphic.png';
    link.href = image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onSuccess();
  } catch (error) {
    console.error('Download error:', error);
    onError(error as Error);
  }
};
