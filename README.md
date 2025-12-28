# KFZlotti

Eine Progressive Web App zum Lernen deutscher KFZ-Kennzeichen. Finde heraus, welcher Landkreis oder welche Stadt sich hinter einem Kennzeichen verbirgt – mit Quiz-Modus, interaktiver Karte und Offline-Unterstützung.

## ✨ Features

- **🔍 Kennzeichen-Suche** – Schnelle Suche nach Kürzeln, Städten oder Landkreisen
- **📍 Standort-Erkennung** – Zeigt das Kennzeichen deines aktuellen Standorts
- **🗺️ Interaktive Karte** – Visualisierung aller Landkreise mit TopoJSON
- **🎮 Quiz-Modus** – Lerne spielerisch mit verschiedenen Schwierigkeitsgraden
- **📱 PWA** – Installierbar auf dem Smartphone, funktioniert offline
- **🌙 Dark Mode** – Automatische Anpassung ans System-Theme

## 🚀 Schnellstart

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher empfohlen)
- npm oder [bun](https://bun.sh/)

### Installation

```bash
# Repository klonen
git clone https://github.com/ndrstmr/kfzlotti-explorer.git
cd kfzlotti

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

### Build für Produktion

```bash
npm run build
# oder
bun run build
```

Die fertigen Dateien liegen dann im `dist/`-Ordner.

## ⚙️ Konfiguration

### Impressum anpassen

Vor der Veröffentlichung musst du deine Kontaktdaten in `src/config/site.ts` eintragen:

```typescript
export const siteConfig = {
  appName: 'KFZlotti',

  legal: {
    name: 'Max Mustermann',           // Dein Name
    street: 'Musterstraße 123',       // Deine Adresse
    city: '12345 Musterstadt',        // PLZ und Ort
    email: 'kontakt@example.de',      // Deine E-Mail
  },

  // ...
};
```

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

## 🛠️ Technologien

- **[React](https://react.dev/)** – UI-Framework
- **[Vite](https://vitejs.dev/)** – Build-Tool
- **[TypeScript](https://www.typescriptlang.org/)** – Typsicherheit
- **[Tailwind CSS](https://tailwindcss.com/)** – Styling
- **[shadcn/ui](https://ui.shadcn.com/)** – UI-Komponenten
- **[React Router](https://reactrouter.com/)** – Routing
- **[Leaflet](https://leafletjs.com/)** – Kartenvisualisierung
- **[Vite PWA](https://vite-pwa-org.netlify.app/)** – Progressive Web App

## 🤝 Beitragen

Beiträge sind willkommen! So kannst du helfen:

1. **Fork** das Repository
2. Erstelle einen **Feature-Branch** (`git checkout -b feature/mein-feature`)
3. **Committe** deine Änderungen (`git commit -m 'Füge neues Feature hinzu'`)
4. **Push** zum Branch (`git push origin feature/mein-feature`)
5. Öffne einen **Pull Request**

### Entwicklungsrichtlinien

- Nutze TypeScript für alle neuen Dateien
- Folge dem bestehenden Code-Stil
- Schreibe aussagekräftige Commit-Messages
- Teste deine Änderungen vor dem PR

## 📊 Datenquellen

Die Kennzeichen-Daten stammen aus öffentlichen Quellen:

- Geodaten: © GeoBasis-DE / BKG (dl-de/by-2-0)
- KFZ-Kennzeichen: Öffentliche Verzeichnisse (CC BY-SA 4.0)

## 📄 Lizenz

Dieses Projekt steht unter der **EUPL 1.2** Lizenz – siehe [LICENSE](LICENSE) für Details.

Die Daten unterliegen eigenen Lizenzen:

- Geodaten: [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0)
- KFZ-Daten: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

Erstellt mit ❤️ und [Lovable](https://lovable.dev)
