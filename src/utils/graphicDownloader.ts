
import { Match } from '@/lib/api/matches';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Get computed styles
    const styles = window.getComputedStyle(graphicRef);
    
    // Create SVG wrapper with proper dimensions and styling
    const svgData = `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="${graphicRef.offsetWidth}"
        height="${graphicRef.offsetHeight}"
      >
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { font-family: 'Inter', sans-serif; }
        </style>
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml"
            style="width: 100%; height: 100%; background: ${styles.background}; color: ${styles.color}; padding: ${styles.padding};">
            ${graphicRef.innerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    // Create canvas
    const canvas = document.createElement('canvas');
    const scale = 2; // Higher resolution
    canvas.width = graphicRef.offsetWidth * scale;
    canvas.height = graphicRef.offsetHeight * scale;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw white background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create a Blob with the SVG data
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
          // Convert to PNG and download
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = 'match-graphic.png';
          link.href = pngUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Cleanup
          URL.revokeObjectURL(svgUrl);
          onSuccess();
          resolve(true);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        const error = new Error('Failed to generate the graphic');
        onError(error);
        reject(error);
      };

      // Set image source to SVG URL
      img.src = svgUrl;
    });
  } catch (error) {
    console.error('Download error:', error);
    onError(error instanceof Error ? error : new Error('Failed to generate the graphic'));
    return Promise.reject(error);
  }
};
