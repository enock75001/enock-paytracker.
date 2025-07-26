
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
    // This is to avoid a flash of the progress bar on initial load.
    const timer = setTimeout(() => {
        NProgress.configure({ showSpinner: false });
    
        const handleStart = () => NProgress.start();
        const handleStop = () => NProgress.done();
    
        // We are using a custom event system to trigger the progress bar
        // because the Next.js router events are not firing reliably with the App Router.
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
          handleStart();
          originalPushState.apply(history, args);
        };
    
        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
          handleStart();
          originalReplaceState.apply(history, args);
        };
    
        window.addEventListener('popstate', handleStop);
    
        // This will handle the initial page load.
        handleStop();
    
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
