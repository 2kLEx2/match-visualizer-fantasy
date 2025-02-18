
import { Match } from '@/lib/api/matches';
import { supabase } from '@/lib/supabase/client';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    const settings = {
      showLogos: true,
      showTime: true,
      backgroundColor: '#1a1b1e',
      textColor: 'white'
    };

    const { data, error } = await supabase.functions.invoke('render-graphic', {
      body: { matches, settings }
    });

    if (error) throw error;
    if (!data?.image) throw new Error('No image data received');

    // Create blob from base64 data
    const response = await fetch(`data:image/png;base64,${data.image}`);
    const blob = await response.blob();

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
