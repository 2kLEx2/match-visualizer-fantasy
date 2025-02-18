
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a wrapper div with solid background
    const wrapper = document.createElement('div');
    wrapper.style.backgroundColor = '#1a1b1e';
    wrapper.style.padding = '20px';
    wrapper.style.width = 'fit-content';
    
    // Clone the graphic element
    const clone = graphicRef.cloneNode(true) as HTMLElement;
    
    // Ensure the clone maintains all the styling
    const computedStyle = window.getComputedStyle(graphicRef);
    clone.style.cssText = computedStyle.cssText;
    clone.style.backgroundColor = '#1a1b1e';
    clone.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://i.imgur.com/tYDGmvR.png)`;
    clone.style.transform = 'none'; // Remove scaling for capture
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#1a1b1e',
      scale: 2,
      logging: true, // Enable logging to debug
      useCORS: true,
      allowTaint: true,
      removeContainer: true,
      foreignObjectRendering: true,
      width: graphicRef.offsetWidth,
      height: graphicRef.offsetHeight
    });

    // Cleanup the wrapper
    document.body.removeChild(wrapper);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0);
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
