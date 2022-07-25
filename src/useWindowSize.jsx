import { useState, useEffect } from 'react';

// Hook
export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: Math.min(window.innerWidth, 1200),
        height: Math.min(window.innerHeight, 600),
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return windowSize;
}
