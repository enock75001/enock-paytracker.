
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function PageProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
        NProgress.configure({ showSpinner: false });
    
        const handleStart = () => NProgress.start();
        const handleStop = () => NProgress.done();
    
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
          handleStart();
          return originalPushState.apply(history, args);
        };
    
        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
          handleStart();
          return originalReplaceState.apply(history, args);
        };
    
        window.addEventListener('popstate', handleStop);
    
        return () => {
          history.pushState = originalPushState;
          history.replaceState = originalReplaceState;
          window.removeEventListener('popstate', handleStop);
        };
    }, 1);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
