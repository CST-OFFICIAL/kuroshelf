import { useState, useEffect } from 'react';

export function usePaginationCounts() {
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initialCount = isPhone ? 16 : 25;
  const loadMoreCount = isPhone ? 8 : 25;

  return {
    isPhone,
    initialCount,
    loadMoreCount,
  };
}
