
import { Match } from '@/lib/api/matches';
import html2canvas from 'html2canvas';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Simple delay to ensure content is rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic html2canvas configuration
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
