import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UpdateProvider } from '@/contexts/UpdateContext';

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

// Capture updateSW function for manual update triggering
const updateSW = registerSW({
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

    // Check for updates periodically (every 60 seconds)
    if (registration) {
      setInterval(() => {
        registration.update().catch(err => {
          console.error('Failed to check for updates:', err);
        });
      }, 60000);
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <SettingsProvider>
    <UpdateProvider updateSW={updateSW}>
      <App />
    </UpdateProvider>
  </SettingsProvider>
);
