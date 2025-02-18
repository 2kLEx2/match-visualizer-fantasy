
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Clone the graphic element
    const clone = graphicRef.cloneNode(true) as HTMLElement;
    container.appendChild(clone);

    // Convert the element to SVG using foreignObject
    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${graphicRef.offsetWidth}" height="${graphicRef.offsetHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${container.innerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    // Create a Blob from the SVG
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(blob);

    // Create an Image to convert SVG to canvas
    const img = new Image();
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = graphicRef.offsetWidth * 2; // Higher resolution
      canvas.height = graphicRef.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        const pngURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'match-graphic.png';
        link.href = pngURL;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(blobURL);
        document.body.removeChild(container);
        onSuccess();
      }
    };

    img.onerror = (error) => {
      console.error('Image loading error:', error);
      document.body.removeChild(container);
      onError(new Error('Failed to load image for conversion'));
    };

    img.src = blobURL;
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('An unknown error occurred'));
  }
};
