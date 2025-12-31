import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UpdateProvider } from '@/contexts/UpdateContext';

// PWA Service Worker Registration (with graceful degradation for older browsers)
import { registerSW } from 'virtual:pwa-register';

// Check if Service Worker is supported (not available in Android 4.4 and older)
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

if ('serviceWorker' in navigator) {
  // Modern browser - register Service Worker
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, please refresh.');
      // Dispatch custom event to notify UpdateContext
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onOfflineReady() {
      console.log('App ready to work offline.');
    },
    onRegisteredSW(swScriptUrl, registration) {
      console.log('Service Worker registered:', swScriptUrl);

      // Check for updates periodically (every 60 minutes)
      if (registration) {
        setInterval(async () => {
          try {
            // Only update if service worker is active and not in an invalid state
            if (registration.active && navigator.onLine) {
              await registration.update();
            }
          } catch (err) {
            // Silently fail - update checks are non-critical
            // Error might occur when SW is updating or in transitional state
          }
        }, 3600000); // 60 minutes instead of 60 seconds
      }
    },
  });
} else {
  // Older browser - Service Worker not supported
  console.warn('Service Worker not supported. App will work but offline functionality is limited.');
  // Create dummy updateSW function for compatibility
  updateSW = async () => {
    console.log('Manual update not available without Service Worker support.');
  };
}

createRoot(document.getElementById("root")!).render(
  <SettingsProvider>
    <UpdateProvider updateSW={updateSW}>
      <App />
    </UpdateProvider>
  </SettingsProvider>
);
