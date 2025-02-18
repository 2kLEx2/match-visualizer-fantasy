
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    
    // Set temporary background color for capture
    const originalBackground = graphicRef.style.background;
    graphicRef.style.background = '#1a1b1e'; // Dark background to match the UI

    const canvas = await html2canvas(graphicRef, {
      backgroundColor: '#1a1b1e', // Solid background color
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      removeContainer: false,
      foreignObjectRendering: true
    });

    // Restore original background
    graphicRef.style.background = originalBackground;

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0); // Use maximum quality
    });

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
