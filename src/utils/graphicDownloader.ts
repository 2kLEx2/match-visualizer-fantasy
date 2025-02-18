
import { Match } from '@/lib/api/matches';
import domtoimage from 'dom-to-image';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Wait for next frame to ensure all content is rendered
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Create a clone of the element
    const clone = graphicRef.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    // Generate PNG blob
    const blob = await domtoimage.toBlob(clone, {
      quality: 1,
      bgcolor: '#000000',
      style: {
        'transform': 'none',
        'width': `${graphicRef.offsetWidth}px`,
        'height': `${graphicRef.offsetHeight}px`
      }
    });

    // Remove clone
    document.body.removeChild(clone);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'match-graphic.png';
    link.href = url;
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
