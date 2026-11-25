'use client';
import { useEffect } from 'react';
export function PwaRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* PWA is optional; the website remains available. */ });
    }
  }, []);
  return null;
}
