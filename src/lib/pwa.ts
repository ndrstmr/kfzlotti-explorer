/**
 * PWA utilities and hooks
 */

import { useState, useEffect } from 'react';

/**
 * Check if the app is running as an installed PWA
 */
// Type augmentation for iOS-specific navigator property
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export function isPwaInstalled(): boolean {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari standalone mode
  if ((navigator as NavigatorStandalone).standalone === true) {
    return true;
  }

  return false;
}

/**
 * Check if running on iOS
 */
export function isIos(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Check if running in Safari
 */
export function isIosSafari(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return isIos() && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return /android/i.test(window.navigator.userAgent);
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook for checking if app should show install prompt
 */
export function useInstallPrompt(): {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  promptInstall: () => Promise<boolean>;
} {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    setIsInstalled(isPwaInstalled());
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };
  
  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    isIos: isIos(),
    promptInstall,
  };
}

/**
 * Register service worker manually if needed
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}
