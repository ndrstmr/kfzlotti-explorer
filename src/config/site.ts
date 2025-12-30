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
  appName: "KFZlotti",

  // Impressum / Legal Notice
  legal: {
    name: "Andreas Teumer",
    street: "Am Ehrenmal 12",
    city: "22175 Hamburg",
    email: "ndrstmr@outlook.de",
  },

  // Optional: Links
  links: {
    github: "https://github.com/ndrstmr/kfzlotti-explorer",
    // Add more links as needed
  },

  // App Version
  version: "2.2.1",
} as const;

export type SiteConfig = typeof siteConfig;
