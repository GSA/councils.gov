import { useEffect } from 'react';

export default function USWDSInit() {
  const initUSWDS = () => {
    if (typeof window !== 'undefined') {
      import('@uswds/uswds').then((uswds) => {
        if (uswds.default && typeof uswds.default.on === 'function') {
          uswds.default.on(window);
        } else if (uswds.on && typeof uswds.on === 'function') {
          uswds.on(window);
        }
      }).catch(() => {
        // If USWDS JS fails to load, components will still work with CSS
        console.warn('USWDS JavaScript could not be loaded');
      });
    }
  };

  useEffect(() => {
    // Initialize USWDS on mount
    initUSWDS();

    // Reinitialize on ViewTransitions page change
    const handlePageLoad = () => {
      // Small delay to ensure DOM is ready
      setTimeout(initUSWDS, 100);
    };

    // Listen for Astro ViewTransitions events
    document.addEventListener('astro:page-load', handlePageLoad);
    window.addEventListener('load', handlePageLoad);

    return () => {
      document.removeEventListener('astro:page-load', handlePageLoad);
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  return null;
}

