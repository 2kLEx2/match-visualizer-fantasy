
import html2canvas from 'html2canvas';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  selectedMatches: any[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Pre-load all images including logos and background
    const allImages = [
      'https://i.imgur.com/tYDGmvR.png',
      ...selectedMatches.flatMap(match => [match.team1.logo, match.team2.logo]).filter(Boolean)
    ];

    await Promise.all(allImages.map(url => {
      if (!url) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.src = url;
      });
    }));

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '600px';
    container.style.backgroundColor = '#1a1a1a';
    document.body.appendChild(container);

    // Clone the graphic
    const clone = graphicRef.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    container.appendChild(clone);

    // Ensure all images in the clone have crossOrigin set
    const images = clone.getElementsByTagName('img');
    Array.from(images).forEach(img => {
      img.crossOrigin = 'anonymous';
      img.style.imageRendering = 'high-quality';
    });

    // Create canvas with proper settings
    const canvas = await html2canvas(clone, {
      backgroundColor: '#1a1a1a',
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      imageTimeout: 0,
      removeContainer: true,
      width: 600,
      height: clone.offsetHeight,
    });

    // Clean up
    document.body.removeChild(container);

    // Convert to PNG with proper alpha channel handling
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = image;
    link.download = 'match-graphic.png';
    link.click();

    onSuccess();
  } catch (error) {
    onError(error as Error);
  }
};
