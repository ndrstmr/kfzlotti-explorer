# 🚗 KFZlotti

[![CI](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/actions/workflows/ci.yml)
[![License: EUPL 1.2](https://img.shields.io/badge/License-EUPL%201.2-blue.svg)](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)

Eine Progressive Web App zum Lernen deutscher KFZ-Kennzeichen. Finde heraus, welcher Landkreis oder welche Stadt sich hinter einem Kennzeichen verbirgt – mit Quiz-Modus, interaktiver Karte und Offline-Unterstützung.

> 🎯 **Kindgerecht · Datenschutzfreundlich · Offline-First**

[Live Demo](https://[YOUR-DOMAIN]) • [Dokumentation](./CLAUDE.md) • [Mitwirken](./CONTRIBUTING.md)

## 📸 Screenshots

<!-- TODO: Füge hier Screenshots deiner Deployment-Version ein -->
```
[Startseite] [Suche] [Quiz] [Karte]
```

## ✨ Features

### Kernfunktionen
- **🔍 Kennzeichen-Suche** – Blitzschnelle Suche nach Kürzeln (z.B. "HH", "M", "B")
- **📍 Standort-Erkennung** – Zeigt automatisch das Kennzeichen deines aktuellen Standorts (optional, privatsphärefreundlich)
- **🗺️ Interaktive Karte** – Visualisierung aller Landkreise mit detaillierten TopoJSON-Geodaten
- **🎯 Quiz-Modi** – Lerne spielerisch mit verschiedenen Modi:
  - **Normal-Modus**: Zufällige Kennzeichen raten
  - **Battle-Modus**: Gegen die Uhr unter Zeitdruck
  - **Fehler-Modus**: Wiederhole nur falsch beantwortete Fragen
- **🏆 Gamification** – Sammle Badges und Achievements beim Lernen
- **📊 Fortschritts-Tracking** – Statistiken über richtige/falsche Antworten

### Technische Highlights
- **📱 Progressive Web App** – Installierbar auf Smartphone & Desktop
- **💾 Offline-First** – Vollständige Funktionalität ohne Internetverbindung
- **🌙 Dark Mode** – Automatische Anpassung ans System-Theme (hell/dunkel/system)
- **♿ Accessibility** – ARIA-Labels, semantisches HTML, Screen-Reader-Unterstützung
- **🚀 Performance** – Code-Splitting, Resource Hints, optimierte Ladezeiten
- **🔒 Sicherheit** – Content Security Policy, Security Headers, OWASP Best Practices
- **🔄 Keine Tracking** – 100% datenschutzfreundlich, keine Cookies, keine Analyse-Tools

## 🚀 Schnellstart

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher empfohlen)
- npm oder [bun](https://bun.sh/)

### Installation

```bash
# Repository klonen
git clone https://github.com/ndrstmr/kfzlotti-explorer.git
cd kfzlotti-explorer

# Abhängigkeiten installieren
npm install
# oder
bun install

# Entwicklungsserver starten
npm run dev
# oder
bun dev
```

Die App ist dann unter `http://localhost:8080` erreichbar.

### Verfügbare Befehle

```bash
# Entwicklungsserver starten
npm run dev / bun dev

# Produktions-Build erstellen
npm run build / bun run build

# Development-Build (für PWA-Debugging)
npm run build:dev / bun run build:dev

# Build lokal testen
npm run preview / bun run preview

# Linter ausführen
npm run lint / bun run lint

# Tests ausführen
npm test / bun test

# Tests mit UI
npm run test:ui / bun run test:ui

# Test-Coverage anzeigen
npm run test:coverage / bun run test:coverage
```

Die fertigen Dateien liegen nach dem Build im `dist/`-Ordner.

## ⚙️ Konfiguration

### ⚠️ Wichtig: Impressum anpassen

**Vor der Veröffentlichung musst du deine Kontaktdaten in `src/config/site.ts` eintragen!**

Nach deutschem Recht (§ 5 TMG) benötigen öffentliche Webseiten ein Impressum. Die Vorlage enthält Platzhalter, die du ersetzen musst:

```typescript
export const siteConfig = {
  appName: 'KFZlotti',

  legal: {
    name: '[Dein vollständiger Name]',       // ⚠️ ÄNDERN!
    street: '[Straße und Hausnummer]',       // ⚠️ ÄNDERN!
    city: '[PLZ und Ort]',                   // ⚠️ ÄNDERN!
    email: '[Deine Kontakt-E-Mail]',         // ⚠️ ÄNDERN!
  },
};
```

**Die App zeigt eine Warnung an**, wenn du die Platzhalter nicht ersetzt hast.

### Weitere Konfiguration

- **Domain/URL**: Ersetze `[YOUR-DOMAIN]` in `public/sitemap.xml` und `public/robots.txt`
- **GitHub Badge**: Ersetze `[YOUR-USERNAME]` im README-Badge

## 📁 Projektstruktur

```
src/
├── components/          # React-Komponenten
│   ├── ui/             # shadcn/ui Basis-Komponenten
│   └── ...             # App-spezifische Komponenten
├── config/             # Konfigurationsdateien
├── data/               # Statische Daten und Schemas
├── hooks/              # Custom React Hooks
├── lib/                # Hilfsfunktionen
├── pages/              # Seiten-Komponenten
└── index.css           # Globale Styles & Design-Tokens

public/
├── data/               # JSON-Daten (Kennzeichen, Geodaten)
├── icons/              # App-Icons für PWA
└── manifest.webmanifest
```

## 🛠️ Tech Stack

### Frontend
- **[React 18.3](https://react.dev/)** – UI-Framework mit Hooks
- **[TypeScript 5.8](https://www.typescriptlang.org/)** – Typsicherheit & IntelliSense
- **[Vite 5.4](https://vitejs.dev/)** – Blitzschneller Build-Tool & Dev-Server
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** – Utility-First CSS
- **[shadcn/ui](https://ui.shadcn.com/)** – Hochwertige, zugängliche UI-Komponenten
- **[React Router 6](https://reactrouter.com/)** – Client-seitiges Routing

### PWA & Storage
- **[Vite PWA](https://vite-pwa-org.netlify.app/)** – Service Worker & Manifest
- **[Dexie.js](https://dexie.org/)** – IndexedDB Wrapper für lokale Datenhaltung
- **[Workbox](https://developer.chrome.com/docs/workbox/)** – Service Worker Strategien

### Mapping & Data
- **[Leaflet](https://leafletjs.com/)** – Interaktive Karten-Visualisierung
- **[TopoJSON](https://github.com/topojson/topojson)** – Komprimierte Geodaten
- **[React Leaflet](https://react-leaflet.js.org/)** – React-Integration für Leaflet

### Testing & Quality
- **[Vitest](https://vitest.dev/)** – Unit & Integration Tests
- **[ESLint](https://eslint.org/)** – Code-Linting
- **[TypeScript-ESLint](https://typescript-eslint.io/)** – TypeScript-Regeln
- **[Happy DOM](https://github.com/capricorn86/happy-dom)** – Leichtgewichtige DOM-Implementierung für Tests

### Build & Deploy
- **[Bun](https://bun.sh/)** – Schneller JavaScript-Runtime & Package Manager (optional)
- **[GitHub Actions](https://github.com/features/actions)** – CI/CD Pipeline
- **[Netlify](https://www.netlify.com/) / [Vercel](https://vercel.com/)** – Deployment-Plattformen (Konfigurationen vorhanden)

## 🤝 Mitwirken (Contributing)

Beiträge sind herzlich willkommen! Bitte lies zuerst **[CONTRIBUTING.md](./CONTRIBUTING.md)** für detaillierte Richtlinien.

### Quick Start für Contributors

1. **Fork** das Repository
2. **Clone** deinen Fork: `git clone https://github.com/dein-username/kfzlotti-explorer.git`
3. Erstelle einen **Feature-Branch**: `git checkout -b feature/mein-feature`
4. Installiere Dependencies: `bun install` (oder `npm install`)
5. Starte den Dev-Server: `bun dev`
6. **Committe** deine Änderungen: `git commit -m 'feat: Füge neues Feature hinzu'`
7. **Push** zum Branch: `git push origin feature/mein-feature`
8. Öffne einen **Pull Request** über GitHub

### Entwicklungsrichtlinien

- ✅ Nutze **TypeScript** für alle neuen Dateien (kein `any`!)
- ✅ Folge dem bestehenden **Code-Stil** (ESLint wird automatisch geprüft)
- ✅ Schreibe **Tests** für neue Features (`src/**/*.test.ts`)
- ✅ Nutze **Conventional Commits** (`feat:`, `fix:`, `docs:`, etc.)
- ✅ Teste lokal vor dem PR: `bun test && bun run build`
- ✅ Stelle sicher, dass die **CI-Pipeline** grün ist

### Issue Templates

Wir haben Templates für:
- 🐛 [Bug Reports](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.md)

### Code of Conduct

Sei freundlich, respektvoll und konstruktiv. Dieses Projekt richtet sich auch an Kinder – halte die Community positiv!

## 🔒 Sicherheit & Datenschutz

- **Keine Cookies** – Kein Tracking, keine Analyse
- **Lokale Speicherung** – Alle Daten bleiben auf deinem Gerät (IndexedDB)
- **Content Security Policy** – Schutz vor XSS und Code Injection
- **Security Headers** – X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS-Only** – Sichere Verbindung erforderlich
- **Open Source** – Vollständig transparent und überprüfbar

Sicherheitsprobleme? Bitte melde sie verantwortungsvoll per E-Mail (siehe Impressum).

## 🐛 Troubleshooting

### PWA installiert sich nicht
- Überprüfe, dass die App über **HTTPS** läuft (oder `localhost`)
- Stelle sicher, dass **Service Worker** registriert ist (Browser DevTools → Application)
- Lösche Cache und versuche es erneut: `Strg+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

### Offline-Modus funktioniert nicht
- Öffne die App einmal online, damit der Service Worker die Daten cachen kann
- Prüfe in DevTools → Application → Service Workers, ob der SW aktiv ist
- Teste mit `bun run build:dev` statt `bun run build` für besseres Debugging

### Tests schlagen fehl
```bash
# Cache löschen und neu installieren
rm -rf node_modules bun.lockb
bun install
bun test
```

Weitere Hilfe: [GitHub Issues](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/issues)

## 🗺️ Roadmap

Geplante Features für zukünftige Versionen:

- [ ] **Kartenvisualisierung** – Interaktive Deutschland-Karte mit Kreisen
- [ ] **Mehrsprachigkeit** – Englische Version
- [ ] **Erweiterte Statistiken** – Detaillierte Lern-Analytics
- [ ] **Teilen-Funktion** – Quiz-Ergebnisse auf Social Media teilen
- [ ] **Community-Features** – High-Score-Listen (optional, datenschutzfreundlich)
- [ ] **Sprachausgabe** – Vorlesen der Kennzeichen für Kinder

Hast du Ideen? [Erstelle einen Feature Request!](.github/ISSUE_TEMPLATE/feature_request.md)

## 📊 Datenquellen

Die Kennzeichen-Daten stammen aus öffentlichen Quellen:

- **Geodaten**: © GeoBasis-DE / BKG (dl-de/by-2-0)
- **KFZ-Kennzeichen**: Wikipedia (CC BY-SA 4.0)
- **Kreisgeometrien**: KFZ250 Datensatz des BKG

Alle Datenquellen sind im [Info-Bereich der App](src/pages/Info.tsx) dokumentiert.

## 📄 Lizenz

### Software
Dieses Projekt steht unter der **EUPL 1.2** (European Union Public Licence) – siehe [LICENSE](LICENSE) für Details.

Die EUPL ist eine von der EU anerkannte Open-Source-Lizenz, kompatibel mit anderen Lizenzen wie GPL und MIT.

### Daten
Die verwendeten Daten unterliegen eigenen Lizenzen:

- **Geodaten**: [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0) – Freie Nutzung mit Quellenangabe
- **KFZ-Daten**: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) – Freie Nutzung mit Namensnennung

## 🙏 Danksagungen

- [GeoBasis-DE / BKG](https://www.bkg.bund.de/) für die Bereitstellung der Geodaten
- [Wikipedia](https://de.wikipedia.org/) für die KFZ-Kennzeichen-Datenbank
- [shadcn/ui](https://ui.shadcn.com/) für die großartigen UI-Komponenten
- [Lovable](https://lovable.dev) als Entwicklungsplattform
- Alle [Contributors](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/graphs/contributors) 🎉

## 📞 Kontakt & Support

- **Issues**: [GitHub Issues](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/issues)
- **Diskussionen**: [GitHub Discussions](https://github.com/[YOUR-USERNAME]/kfzlotti-explorer/discussions)
- **E-Mail**: Siehe [Impressum](src/config/site.ts)

---

Erstellt mit ❤️ und [Lovable](https://lovable.dev) • **Viel Spaß beim Kennzeichen-Lernen!** 🚗
