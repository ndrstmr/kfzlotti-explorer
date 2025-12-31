/**
 * Site Configuration
 *
 * Diese Datei liest Konfigurationswerte aus Environment Variables (.env).
 * Kopiere .env.example nach .env und fülle deine persönlichen Daten ein.
 *
 * This file reads configuration from environment variables (.env).
 * Copy .env.example to .env and fill in your personal data.
 */

export const siteConfig = {
  // App Name
  appName: "KFZlotti",

  // Impressum / Legal Notice
  // Values loaded from .env file (not in Git!)
  legal: {
    name: import.meta.env.VITE_LEGAL_NAME || "[Dein Name]",
    street: import.meta.env.VITE_LEGAL_STREET || "[Straße und Hausnummer]",
    city: import.meta.env.VITE_LEGAL_CITY || "[PLZ Ort]",
    email: import.meta.env.VITE_LEGAL_EMAIL || "[deine@email.de]",
  },

  // Optional: Links
  links: {
    github: import.meta.env.VITE_GITHUB_URL || "https://github.com/yourusername/kfzlotti-explorer",
    // Add more links as needed
  },

  // App Version
  version: "2.3.2",
} as const;

export type SiteConfig = typeof siteConfig;
