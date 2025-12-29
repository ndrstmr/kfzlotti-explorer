import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

// Automatische Updates mit Reload-Prompt
registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
