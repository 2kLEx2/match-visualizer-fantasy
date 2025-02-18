
import { Match } from '@/lib/api/matches';
import { supabase } from '@/lib/supabase/client';

export const downloadGraphic = async (
  graphicRef: HTMLDivElement,
  matches: Match[],
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  try {
    // Get computed styles
    const styles = window.getComputedStyle(graphicRef);
    const cssProperties = Array.from(styles).reduce((acc, prop) => {
      return acc + `${prop}: ${styles.getPropertyValue(prop)};`;
    }, '');

    // Get CSS from stylesheets
    const cssRules = Array.from(document.styleSheets)
      .filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
      .reduce((acc, sheet) => {
        try {
          return acc + Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.warn('Could not read stylesheet rules', e);
          return acc;
        }
      }, '');

    const { data: { session } } = await supabase.auth.getSession();
    
    // Call the render function
    const response = await supabase.functions.invoke('render-graphic', {
      body: {
        html: graphicRef.outerHTML,
        css: cssRules + `.graphic-root { ${cssProperties} }`
      }
    });

    if (!response.data) {
      throw new Error('Failed to generate image');
    }

    // Convert the response to a blob
    const blob = await response.data.blob();
    const url = URL.createObjectURL(blob);

    // Download the image
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
