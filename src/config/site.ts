/**
 * Site Configuration
 * 
 * Diese Datei enthält alle konfigurierbaren Werte für deine Installation.
 * Ersetze die Platzhalter mit deinen echten Daten, bevor du die App veröffentlichst.
 * 
 * This file contains all configurable values for your installation.
 * Replace the placeholders with your real data before publishing the app.
 */

export const siteConfig = {
  // App Name
  appName: 'KFZlotti',
  
  // Impressum / Legal Notice
  legal: {
    name: '[Dein Name]',
    street: '[Straße und Hausnummer]',
    city: '[PLZ Ort]',
    email: '[deine@email.de]',
  },
  
  // Optional: Links
  links: {
    github: 'https://github.com/your-username/kfzlotti',
    // Add more links as needed
  },
  
  // App Version
  version: '1.0.0',
} as const;

export type SiteConfig = typeof siteConfig;
