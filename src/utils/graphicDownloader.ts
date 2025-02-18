
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a wrapper with absolute positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '-1000';
    wrapper.style.backgroundColor = '#1a1b1e';
    wrapper.style.width = `${graphicRef.offsetWidth}px`;
    wrapper.style.height = `${graphicRef.offsetHeight}px`;
    
    // Clone the graphic element
    const clone = graphicRef.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none'; // Remove any scaling
    clone.style.width = `${graphicRef.offsetWidth}px`;
    clone.style.height = `${graphicRef.offsetHeight}px`;
    clone.style.backgroundColor = '#1a1b1e';
    clone.style.position = 'relative';
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait a bit for background image to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#1a1b1e',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      width: graphicRef.offsetWidth,
      height: graphicRef.offsetHeight,
      onclone: (document, element) => {
        const targetElement = element.querySelector('[data-graphic="true"]') as HTMLElement;
        if (targetElement) {
          targetElement.style.backgroundColor = '#1a1b1e';
          targetElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://i.imgur.com/tYDGmvR.png)`;
        }
      }
    });

    // Cleanup
    document.body.removeChild(wrapper);

    // Convert to blob with maximum quality
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
