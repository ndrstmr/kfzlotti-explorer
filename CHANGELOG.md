# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [2.4.4] - 2026-01-01

**🧪 Comprehensive Test Coverage for Critical Paths**

Patch-Release mit umfassender Test-Abdeckung für alle kritischen Library-Funktionen.

### ✨ Neue Features

#### Vollständige Test-Suite für kritische Funktionen
- **storage.test.ts (26 Tests):** IndexedDB/Dexie Storage Layer
  - Cache-Management (get/set/metadata/TTL/expiration)
  - Daten-Migration (Schema v1→v2→v3, alte Formate erkennen)
  - User Progress (Badges, Streaks, Quiz-Tracking)
  - Badge-Freischaltungs-Logik (first_search, ten_searches, streak_3, quiz_master)
- **geo.test.ts (30 Tests):** Geospatial Functions
  - Haversine Distance Calculations (Berlin↔München, Hamburg↔Frankfurt)
  - Bounding Boxes & Centroids (Polygone, MultiPolygone, Holes)
  - TopoJSON→GeoJSON Conversion (Validierung, Error-Handling)
- **pwa.test.ts (30 Tests):** PWA Utilities & Hooks
  - Device Detection (iOS, Android, Safari, Chrome)
  - Install Prompt Handling (beforeinstallprompt, appinstalled Events)
  - Online/Offline Status Tracking
  - Service Worker Registration

#### Test-Infrastruktur
- **Vitest Setup File:** fake-indexeddb Polyfill für alle Tests
- **Test Command Fix:** `npm test` nutzt jetzt `npx vitest` statt `bun test`
  - Problem: `bun test` nutzte bun's eigenen Test-Runner, nicht vitest
  - Lösung: Expliziter `npx vitest run` in package.json
- **Total:** 135 Tests passing (5 Test-Dateien)
  - storage: 26, geo: 30, pwa: 30, normalize: 28, search: 21

### 🔧 Code Quality

#### Type Safety in Tests
- **pwa.test.ts:** `as any` Types durch korrekte Type-Casts ersetzt
  - `Object.assign()` für Event-Mocking
  - `@ts-expect-error` Comments für bewusste Type-Violations
  - Konforme mit `@typescript-eslint/no-explicit-any` Regel

### 📦 Technische Änderungen

- **Dependencies:**
  - `fake-indexeddb@6.2.5` - IndexedDB Polyfill für Tests
  - `@testing-library/react@16.3.1` - React Hook Testing
- **Konfiguration:**
  - `vitest.config.ts`: Setup-File für fake-indexeddb
  - `package.json`: Test-Scripts mit `npx vitest`

### 🎯 Abgeschlossene TODOs

- **TEST-01:** Comprehensive Test Coverage ✅
- **TEST-02:** Storage Layer Tests ✅
- **TEST-03:** Geo Layer Tests ✅
- **TEST-04:** PWA Hooks Tests ✅

---

## [2.4.3] - 2026-01-01

**🛠️ Development Quality & Type Safety Improvements**

Patch-Release mit wichtigen Verbesserungen für Code-Qualität und Entwickler-Workflow.

### ✨ Neue Features

#### Git Hooks für lokale Qualitätssicherung
- **Pre-Commit Hook:** Führt ESLint automatisch vor jedem Commit aus
  - Blockiert Commits bei Linter-Fehlern
  - Verhindert fehlerhafte Code-Uploads zu GitHub
- **Pre-Push Hook:** Führt ESLint + Production Build vor jedem Push aus
  - Blockiert Push bei Linter-Fehlern oder Build-Fehlern
  - Stellt sicher, dass nur deploybare Versionen gepusht werden
- **Automatische Installation:** Hooks werden bei `npm install` / `bun install` installiert
- **Manuelle Installation:** `npm run hooks:install`
- **Dokumentation:** CONTRIBUTING.md erweitert mit Git Hooks Sektion

#### Selective Merge: Lovable-Bot Type Safety Verbesserungen
- **vite-env.d.ts:** Type Declarations für `virtual:pwa-register` hinzugefügt
  - Verbessert TypeScript-Support für PWA-Module
  - Eliminiert Type-Errors beim Service Worker Import
- **geo.ts:** Robustere TopoJSON Validierung
  - Runtime-Checks: `type: 'Topology'`, `objects`, `arcs` Validierung
  - Verhindert Crashes bei invaliden Geodaten
  - Bessere Type Safety mit `unknown` + Type Guards
- **pwa.ts:** Expliziter Type Cast für `BeforeInstallPromptEvent`
- **SettingsContext.tsx:** Importiert `UserSettings` direkt aus `schema.ts`
  - Klare Separation: Schema-Definitionen in schema.ts, Storage-Funktionen in storage.ts

### 🔧 Bug Fixes

#### Linter-Fehler in Validierungsfunktionen
- **Fix:** `any` type in `useKfzData.ts` durch `unknown` ersetzt (Zeilen 28, 39)
  - `isValidTopoJson(data: any)` → `isValidTopoJson(data: unknown)`
  - `isValidSeatsData(data: any)` → `isValidSeatsData(data: unknown)`
- **Impact:** ESLint-Regel `@typescript-eslint/no-explicit-any` wird nicht mehr verletzt
- **Security:** Type Safety bleibt erhalten (Runtime-Validierung funktioniert weiterhin)

### 📦 Technische Änderungen

- **package.json:**
  - `"prepare": "bash scripts/install-git-hooks.sh || true"` → Automatische Hook-Installation
  - `"hooks:install": "bash scripts/install-git-hooks.sh"` → Manuelle Installation
- **scripts/git-hooks/:** Pre-Commit und Pre-Push Hook Templates versioniert
- **scripts/install-git-hooks.sh:** Installations-Skript für Git Hooks
- **CONTRIBUTING.md:** Git Hooks Dokumentation hinzugefügt
- **Generierte Dateien:** index.transformed.json & generated-fallback.ts aktualisiert

### 🎯 Vorteile

- ✅ Kein fehlerhafter Code mehr auf GitHub (Hooks blockieren Push)
- ✅ Bessere Type Safety (keine `any` types, bessere PWA-Typen)
- ✅ Robustere Geodaten-Validierung (verhindert Crashes)
- ✅ Automatisierter Qualitäts-Check bei jedem Commit/Push
- ✅ Klare Dokumentation für Contributor (CONTRIBUTING.md)

### ⚠️ Breaking Changes

Keine Breaking Changes - alle Änderungen sind rückwärtskompatibel.

---

## [2.4.2] - 2025-12-31

**🔒 Security Fix - CSP Legacy Plugin Compatibility**

Patch-Release zur Behebung von CSP-Violations durch Legacy Browser Support.

### 🔧 Bug Fixes

#### CSP Violations für Legacy Plugin Inline-Scripts
- **Fix:** Content Security Policy blockierte Vite Legacy Plugin Scripts
  - Browser-Detection-Scripts wurden als "unsafe-inline" gewertet
  - CSP-Violations in Console auf allen Seiten
- **Lösung:** Script-Hashes zur Production CSP hinzugefügt
  - `sha256-ZxAi3a7m9Mzbc+Z1LGuCCK5Xee6reDkEPRas66H9KSo=`
  - `sha256-+5XkZFazzJo8n0iOP4ti/cLCMUudTf//Mzkb7xNPXIc=`
- **Impact:** Keine CSP-Violations mehr, Legacy Browser Support funktioniert einwandfrei

### 📦 Technische Änderungen

- **scripts/fix-production-csp.ts:** Script-Hashes für Legacy Plugin hinzugefügt
- **Security:** Strikte CSP bleibt erhalten (kein `unsafe-inline` nötig)
- **Compatibility:** Android 4.4+ und iOS 9+ funktionieren weiterhin

### 🎯 Warum wichtig?

Die Legacy Plugin Inline-Scripts sind **notwendig** für:
- Browser-Capability-Detection (modern vs. legacy)
- Automatisches Laden des korrekten Bundles
- Android 4.4+ und iOS 9+ Support

Ohne diese Fix würden die Scripts blockiert → Android 4.4 würde wieder White Screen zeigen.

---

## [2.4.1] - 2025-12-31

**🔧 Bug Fixes & Build Improvements**

Patch-Release mit wichtigen Fixes für Routing und automatisierter Domain-Ersetzung.

### 🔧 Bug Fixes

#### Sitemap HashRouter URLs
- **Fix:** sitemap.xml hatte noch alte BrowserRouter-URLs
  - `/quiz` → `/#/quiz`
  - `/info` → `/#/info`
  - `/settings` → `/#/settings`
- **Fix:** 404-Fehler bei Hard-Reload (Ctrl+Shift+R) auf Unterseiten behoben
- **Impact:** Sitemap ist jetzt kompatibel mit HashRouter (seit v2.3.1)

### ✨ Neue Features

#### Automatische Domain-Ersetzung im Build
- **Neu:** `VITE_BASE_URL` Environment Variable
  - Wird in `.env` gesetzt (privat, nicht in Git)
  - Beispiel: `VITE_BASE_URL="https://kfzlotti.example.com"`
- **Build-Script:** `scripts/replace-domain.ts`
  - Ersetzt automatisch `[YOUR-DOMAIN]` in `sitemap.xml`
  - Ersetzt automatisch `[YOUR-DOMAIN]` in `robots.txt`
  - Validiert URL-Format
  - Warnt bei fehlender Variable (bricht Build nicht ab)

### 📦 Technische Änderungen

- **Build-Pipeline erweitert:**
  ```bash
  1. prebuild: build:data
  2. vite build
  3. replace-domain ← NEU!
  4. fix-production-csp
  ```
- **`.env.example`:** VITE_BASE_URL Dokumentation hinzugefügt
- **package.json:** Build-Script aktualisiert
- **Generierte Dateien:** index.transformed.json & generated-fallback.ts aktualisiert

### 🎯 Vorteile

- ✅ Keine manuelle Bearbeitung von sitemap.xml mehr nötig
- ✅ `.env` bleibt privat (nicht in Git)
- ✅ Verschiedene Domains für dev/staging/prod möglich
- ✅ HashRouter-URLs in Sitemap korrekt
- ✅ Hard-Reload funktioniert auf allen Seiten

---

## [2.4.0] - 2025-12-31

**🌍 Legacy Browser Support - Android 4.4+ Kompatibilität**

Diese Version macht die PWA auf älteren Android-Geräten lauffähig.

### ✨ Neue Features

#### Legacy Browser Support
- **Android 4.4+ Unterstützung** (Chromium 30+, 2013)
- **iOS 9+ / Safari 9+ Unterstützung** (2015)
- **Dual Build System:**
  - Modern Build (ES2020): 427 KB für aktuelle Browser
  - Legacy Build (ES5): 600 KB für alte Browser
- **Polyfills automatisch:** Promise, fetch, Array-Methoden, etc.
- **Smart Script Loading:** Browser laden nur die passende Version

#### Service Worker Graceful Degradation
- **Automatische Erkennung** ob Service Worker verfügbar ist
- **Alte Browser:** App läuft ohne SW (eingeschränkte Offline-Features)
- **Moderne Browser:** Volle PWA-Funktionalität (unverändert)
- **Console-Warnung** bei fehlendem SW-Support (für Debugging)

### 🔧 Bug Fixes

- **Fix:** White Screen auf Android 4.4.4 behoben
  - ES2020 Code wurde nicht verstanden → Transpilierung zu ES5
  - Fehlende Polyfills ergänzt (Promise, fetch, etc.)
- **Fix:** Service Worker Crash auf alten Geräten
  - Prüfung vor Registrierung hinzugefügt
  - Dummy-Funktion für alte Browser (Kompatibilität)

### 📦 Technische Änderungen

- **Dependencies:** `@vitejs/plugin-legacy@7.2.1`, `terser@5.44.1`
- **vite.config.ts:** Legacy Plugin mit Browser-Targets konfiguriert
- **package.json:** Browserslist für Android 4.4+, Chrome 30+, iOS 9+
- **src/main.tsx:** Service Worker Check vor Registrierung
- **Build-Zeit:** ~4s → ~15s (Dual Build)
- **Bundle-Größe (modern):** Unverändert (427 KB / 138 KB gzip)
- **Bundle-Größe (legacy):** 600 KB / 177 KB gzip

### 📊 Browser-Support

**Vorher:**
- Chrome 90+ ✅
- Safari 15+ ✅
- Firefox 88+ ✅
- Android 4.4 ❌ (White Screen)

**Jetzt:**
- Chrome 30+ ✅ (2013)
- Safari 9+ ✅ (2015)
- iOS 9+ ✅ (2015)
- Android 4.4+ ✅ (KitKat, 2013)
- Alle modernen Browser ✅ (unverändert)

### ⚠️ Bekannte Einschränkungen

**Android 4.4 Geräte:**
- ⚠️ Kein Service Worker (nicht unterstützt in Chromium 30)
- ⚠️ Eingeschränkte Offline-Funktionalität
- ⚠️ Größerer Download (~600 KB statt ~427 KB)
- ✅ App funktioniert vollständig (Suche, Quiz, etc.)
- ✅ Daten werden trotzdem gecacht (IndexedDB)

---

## [2.3.3] - 2025-12-31

**🛡️ Data Validation & UI Feedback**

Diese Version verhindert Caching von leeren Geodaten-Platzhaltern.

### 🔧 Bug Fixes

#### Empty Geodata Validation (DATA-01 - Critical)
- **Fix:** Leere `kfz250.topo.json` (128 Bytes) wird nicht mehr gecacht
  - Validierung prüft `geometries.length > 0` vor Cache-Write
  - Console-Warnung wenn Geodaten leer sind
- **Fix:** Leere `seats.json` (128 Bytes) wird nicht mehr gecacht
  - Validierung prüft `Object.keys(seats).length > 0`
- **Impact:** Karten-Feature bleibt funktionsfähig sobald echte Geodaten verfügbar sind

### ✨ Neue Features

#### Map Availability Status UI
- **Settings-Page:** Zeigt Karten-Verfügbarkeit an
  - ✅ Grün: "Karten-Daten: Verfügbar" (wenn TopoJSON gültig)
  - ❌ Gelb: "Karten-Daten: Nicht verfügbar" (wenn TopoJSON leer)
- **useKfzData Hook:** Neues `mapAvailable` Flag
- **Transparenz:** User sieht sofort ob Karte funktioniert

### 📦 Technische Änderungen

- **src/hooks/useKfzData.ts:**
  - `isValidTopoJson()` Validierungsfunktion
  - `isValidSeatsData()` Validierungsfunktion
  - `mapAvailable` Flag in DataState
- **src/pages/Settings.tsx:**
  - Map-Status-Anzeige mit Icons (Map, XCircle)
  - Import von `useKfzData` Hook
- **src/data/schema.ts:** DataState erweitert um `mapAvailable: boolean`

---

## [2.3.2] - 2025-12-31

**⚡ Service Worker Cache Strategy Fix**

Diese Version behebt kritisches Caching-Problem bei Daten-Updates.

### 🔧 Bug Fixes

#### Service Worker blockiert Daten-Updates (ARCH-01 - Critical)
- **Fix:** Cache Strategy: `CacheFirst` → `NetworkFirst`
  - Daten-Updates erreichen App sofort wenn online
  - 5s Network-Timeout für schnellen Offline-Fallback
  - Cache wird weiterhin genutzt (Offline-First bleibt erhalten)
- **Fix:** Version-Check funktioniert jetzt korrekt
  - `If-None-Match` Header erreicht Server (nicht von SW blockiert)
  - `dataVersion` Comparison funktioniert wie geplant
- **Impact:** Nutzer erhalten Daten-Updates ohne App-Neuinstallation

#### Offline-Mode Kompatibilität
- **Bestätigt:** `offlineMode` Setting funktioniert weiterhin
  - Wenn aktiviert: App fetcht nie → NetworkFirst irrelevant
  - Service Worker wird bei offlineMode nicht genutzt
  - App-Level-Kontrolle bleibt dominant

### 📦 Technische Änderungen

- **vite.config.ts:**
  - `/data/*.json` Handler: `CacheFirst` → `NetworkFirst`
  - `networkTimeoutSeconds: 5` für schnellen Fallback
  - Cache-Expiration unverändert (30 Tage)

---

## [2.3.1] - 2025-12-31

**🚀 Universal Deployment & Critical Bug Fixes**

Diese Version macht die PWA vollständig portabel und behebt kritische Fehler.

### 🔧 Bug Fixes

#### Battle Quiz
- **Fix:** `ReferenceError: defaultPlayerName is not defined` behoben
  - Variable wird jetzt korrekt aus `settings?.displayName` geladen
  - Verhindert Absturz beim Navigieren zum Battle-Modus

#### Service Worker Updates
- **Fix:** InvalidStateError bei Update-Checks behoben
  - Update-Interval: 60 Sekunden → 60 Minuten (weniger aggressiv)
  - State-Check vor Update-Aufruf (nur wenn SW aktiv)
  - Online-Check vor Update (spart Ressourcen)
  - Silent fail für non-critical Update-Checks

#### Performance
- **Fix:** Preload-Warning für `index.json` behoben
  - Preload aktualisiert: `index.json` → `index.transformed.json`
  - Datei wird jetzt tatsächlich genutzt

### ✨ Refactoring

#### Hash-basiertes Routing (Breaking Change für URLs)
- **Umstellung:** BrowserRouter → HashRouter
- **URLs vorher:** `/quiz`, `/info`, `/settings`
- **URLs jetzt:** `/#/quiz`, `/#/info`, `/#/settings`

**Vorteile:**
- ✅ Funktioniert auf **jedem** Static-File-Server
- ✅ Keine Server-Konfiguration nötig (nginx, Apache, etc.)
- ✅ Deployment: `dist/` hochladen → fertig
- ✅ Open-Source-freundlich (contributors brauchen keine Server-Config)

#### Favicon
- **Neu:** Echtes `favicon.ico` (1.4KB) generiert aus SVG
- **Fix:** 404-Fehler für legacy `/favicon.ico` Requests behoben

### 📦 Technische Änderungen

- `src/App.tsx`: BrowserRouter → HashRouter
- `public/favicon.ico`: Neu erstellt (1.4KB PNG)
- `vercel.json`: Rewrites entfernt (nur Headers behalten)
- `public/_redirects`: Entfernt (nicht mehr nötig)
- `index.html`: Preload auf `index.transformed.json` aktualisiert
- `src/main.tsx`: Service Worker Update-Logik verbessert
- `src/components/BattleQuiz.tsx`: defaultPlayerName Variable definiert

### ⚠️ Breaking Changes

**URL-Format:**
- Alte URLs (`/quiz`) führen jetzt zur 404-Seite
- Neue URLs verwenden Hash (`/#/quiz`)
- **Migration:** Keine User-Aktion nötig - alte Links öffnen Home, Navigation funktioniert

---

## [2.3.0] - 2025-12-30

**🔧 Open Source & Privacy-First Configuration**

Diese Version führt Environment Variables ein, um persönliche Daten (Impressum) vom Code zu trennen. Das ermöglicht Open Source Development bei gleichzeitigem Schutz privater Produktions-Konfigurationen.

### ✨ Neue Features

#### Environment Variables für Site-Konfiguration
- **`.env` Support** für persönliche Daten (Impressum, Kontaktdaten)
- **`.env.example`** Template im Repository für Contributors
- **Automatisches Laden** der Werte beim Build-Prozess
- **Git-sicher**: `.env` wird nicht committed (in `.gitignore`)

**Neue Dateien:**
- `.env.example` - Template mit Platzhaltern (im Git)
- `.env` - Persönliche Daten (lokal, NICHT im Git)

### 🔧 Technische Änderungen

#### src/config/site.ts
**Vorher:**
```typescript
legal: {
  name: "Max Mustermann",  // ❌ Hardcoded im Code
  street: "Musterstraße 123",
  city: "12345 Musterstadt",
  email: "max@example.com",
}
```

**Jetzt:**
```typescript
legal: {
  name: import.meta.env.VITE_LEGAL_NAME || "[Dein Name]",
  street: import.meta.env.VITE_LEGAL_STREET || "[Straße]",
  city: import.meta.env.VITE_LEGAL_CITY || "[PLZ Ort]",
  email: import.meta.env.VITE_LEGAL_EMAIL || "[email@example.com]",
}
```

#### Vite Environment Variables
Nutzt Vites eingebautes ENV-System:
- `VITE_LEGAL_NAME` - Vollständiger Name für Impressum
- `VITE_LEGAL_STREET` - Straße und Hausnummer
- `VITE_LEGAL_CITY` - PLZ und Ort
- `VITE_LEGAL_EMAIL` - Kontakt-E-Mail
- `VITE_GITHUB_URL` - GitHub Repository URL

#### .gitignore
```
# Environment variables (contains personal data)
.env
.env.local
.env.*.local
```

#### README.md
Neue Sektion "⚙️ Konfiguration" mit Setup-Anleitung:
```bash
cp .env.example .env
# Bearbeite .env und fülle persönliche Daten ein
```

### 📊 Vorteile

**Für Projekt-Maintainer:**
- ✅ Persönliche Daten bleiben lokal
- ✅ Production Builds ohne Code-Änderungen
- ✅ Verschiedene Configs für Dev/Staging/Production möglich
- ✅ Keine versehentlichen Leaks von privaten Daten

**Für Contributors (Open Source):**
- ✅ Repository enthält keine persönlichen Daten
- ✅ Klares Setup mit `.env.example`
- ✅ Jeder kann eigene Config nutzen
- ✅ Standard Vite ENV-Approach

**Für Deployments:**
- ✅ CI/CD kann eigene `.env` injizieren
- ✅ Umgebungsspezifische Konfiguration
- ✅ Secrets Management kompatibel

### 🔄 Migration

**Bestehende Installationen:**
1. `.env.example` nach `.env` kopieren:
   ```bash
   cp .env.example .env
   ```
2. `.env` mit persönlichen Daten füllen
3. Build läuft wie gewohnt: `bun run build`

**Neue Installationen:**
- Setup-Anleitung in README.md folgen
- `.env` ist Pflicht vor erstem Build

### ⚠️ Breaking Changes

**KEINE für Nutzer** - Aber Setup-Schritt erforderlich!

Entwickler müssen einmalig:
- `.env` Datei erstellen (aus `.env.example`)
- Persönliche Daten eintragen
- Danach funktioniert alles wie zuvor

### 💡 Best Practices

**DO:**
- ✅ `.env` in `.gitignore` lassen
- ✅ `.env.example` aktuell halten (Template)
- ✅ Persönliche Daten nur in `.env`
- ✅ CI/CD Secrets für Production

**DON'T:**
- ❌ `.env` committen
- ❌ Hardcoded Daten in `site.ts`
- ❌ Secrets in Code schreiben

---

## [2.2.1] - 2025-12-30

**🐛 Critical PWA Bugfixes**

Behebt zwei kritische Bugs die das Update-System und SPA-Routing in der installierten PWA betreffen.

### 🐛 Bug Fixes

#### Update-Installation Crash
- **Fixed:** App stürzte beim Update ab und musste manuell neu gestartet werden
- **Root Cause:** Race Condition zwischen Service Worker Aktivierung und Page Reload
- **Solution:**
  - UpdateContext nutzt jetzt async/await für Service Worker Update
  - 100ms Delay für vollständige Service Worker Aktivierung
  - Error Handling mit Fallback zu window.reload()
  - Service Worker verwendet `skipWaiting: true` für sofortige Aktivierung
  - `clientsClaim: true` übernimmt alle Tabs sofort

#### SPA-Routing 404 Fehler
- **Fixed:** Battle-Modus und andere Quiz-Routes zeigten "Seite nicht gefunden" bei Reload
- **Root Cause:** Service Worker hatte keine explizite Navigation-Strategie für SPA-Routes
- **Solution:**
  - `navigateFallbackAllowlist` statt `navigateFallbackDenylist` (expliziter)
  - Dediziertes Runtime-Caching für Navigation-Requests
  - `NetworkFirst` Strategie mit 3s Timeout für Seiten
  - Alle React Router Routes funktionieren jetzt offline

### 🔧 Technische Änderungen

#### UpdateContext.tsx
```typescript
const installUpdate = useCallback(async () => {
  try {
    if (updateSW) {
      await updateSW(true);  // Wait for activation
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    window.location.reload();  // Hard reload
  } catch (error) {
    console.error('Update installation failed:', error);
    window.location.reload();  // Fallback
  }
}, [updateSW]);
```

#### main.tsx
- `immediate: true` - Service Worker lädt sofort
- Automatische Update-Checks alle 60 Sekunden
- Besseres Error-Logging

#### vite.config.ts
**Workbox-Konfiguration:**
- `skipWaiting: true` - Neuer SW aktiviert sofort
- `clientsClaim: true` - Übernimmt alle Clients instant
- `navigateFallbackAllowlist: [/^\/(?!data\/)/]` - Explizit alle Routes außer /data/
- Navigation Runtime Caching:
  ```typescript
  {
    urlPattern: ({ request, url }) => {
      return request.mode === 'navigate' && !url.pathname.startsWith('/data/');
    },
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3,
    },
  }
  ```
- Removed: Google Fonts Caching (nicht mehr benötigt - Fonts lokal)
- Added: `.ttf` zu globPatterns für lokale Fonts

### 📊 Impact

**User Experience:**
- ✅ Updates funktionieren jetzt ohne Crash
- ✅ Battle-Modus ist erreichbar nach Reload
- ✅ Alle Quiz-Routes funktionieren offline
- ✅ Keine "404 Seite nicht gefunden" mehr

**Technisch:**
- ✅ Robusteres Update-System
- ✅ Bessere SPA-Unterstützung in PWA
- ✅ Schnellere Service Worker Aktivierung

### ⚠️ Breaking Changes

**KEINE** - Alle Änderungen sind abwärtskompatibel!

### 🔄 Migration

**Für Nutzer:** Automatisches Update
- Update wird beim nächsten App-Start angeboten
- "Jetzt aktualisieren" installiert v2.2.1
- Keine manuelle Aktion erforderlich

**Für Entwickler:** Keine Änderungen nötig
- Workbox-Config ist jetzt robuster
- Service Worker API bleibt gleich

---

## [2.2.0] - 2025-12-30

**⚡ Reaktive Settings & Persistenz-Fix**

Diese Version behebt Persistenz-Probleme mit Einstellungen und führt ein reaktives Settings-System ein, das sofortige Updates über alle Komponenten hinweg ermöglicht.

### ✨ Neue Features

#### Reaktives Settings-System
- **SettingsContext** für App-weites Settings State Management
- **Sofortige Updates** in allen Komponenten ohne Component-Remount
- **Single Source of Truth** für alle Nutzer-Einstellungen

**Neue Dateien:**
- `src/contexts/SettingsContext.tsx` - Zentraler Settings Context mit reaktivem State

### 🐛 Bug Fixes

#### Dark Mode Persistenz
- **Fixed:** Dark Mode wurde nicht beim App-Start angewendet
- **Fixed:** Flash von hellem Theme beim Laden
- Lösung: SettingsContext lädt und wendet Dark Mode sofort beim App-Mount an

#### Display Name Konsistenz
- **Fixed:** Display Name aktualisierte sich nicht über Komponenten hinweg
- **Fixed:** Name erschien nicht sofort in Quiz nach Änderung in Settings
- Lösung: Reaktiver Context benachrichtigt alle Komponenten bei Änderungen

#### Offline-Modus UI
- **Fixed:** WiFi-Icon reagierte nicht auf Offline-Modus Toggle
- Lösung: useSettings() Hook macht UI-Elemente reaktiv

### 🔧 Technische Änderungen

#### Aktualisierte Komponenten
- `main.tsx`: SettingsProvider umschließt gesamte App
- `App.tsx`: Dark Mode useEffect entfernt (vom Context übernommen)
- `Settings.tsx`: Nutzt Context-Funktionen statt direkter DB-Updates
- `Index.tsx`: WiFi-Icon reagiert reaktiv auf offlineMode
- `Quiz.tsx`: DisplayName-State aus Context statt lokalem State
- `BattleQuiz.tsx`: Spielername-Vorbelegung reaktiv

#### Context API
```typescript
// SettingsContext bietet:
- settings: UserSettings | null          // Reaktiver State
- isLoading: boolean                      // Loading Indicator
- updateDarkMode(mode): Promise<void>     // Dark Mode ändern
- updateDisplayName(name): Promise<void>  // Name ändern
- updateOfflineMode(enabled): Promise<void> // Offline-Modus togglen
- refreshSettings(): Promise<void>        // Settings neu laden
```

### 📊 Vorteile

**User Experience:**
- ✅ Dark Mode sofort beim App-Start (kein Flash)
- ✅ Display Name Updates sofort in allen Quiz-Modi sichtbar
- ✅ Offline-Modus Toggle wirkt instant auf alle UI-Indikatoren
- ✅ Einstellungen bleiben konsistent über Tabs und Refreshes

**Developer Experience:**
- ✅ Einfaches Hook-API: `const { settings } = useSettings()`
- ✅ Automatische Persistierung in IndexedDB
- ✅ Automatische Benachrichtigung aller Subscriber
- ✅ Kein manuelles State Management mehr nötig

### ⚠️ Breaking Changes

**KEINE** - Alle Änderungen sind abwärtskompatibel!

### 🔄 Migration

**Für Nutzer:** Keine Aktion erforderlich
- Bestehende Einstellungen werden automatisch geladen
- Context übernimmt nahtlos bisheriges Verhalten
- Alle Features funktionieren wie zuvor, nur konsistenter

**Für Entwickler:** API bleibt gleich
- `getUserSettings()` funktioniert weiterhin (für non-reactive Reads)
- Neue Context API optional nutzbar
- Keine Breaking Changes in bestehenden Hooks

---

## [2.0.0] - 2025-12-30

**🎉 Major-Release - Performance & Update-System!**

Diese Version bringt massive Performance-Verbesserungen, vollständige Offline-Unterstützung und ein robustes Update-System. Die App ist jetzt produktionsreif mit professioneller Datenpipeline und Zukunftssicherheit.

### ⚡ Performance-Verbesserungen

#### Build-Time Data Transformation
- **~200ms schnellerer App-Start** durch Eliminierung der Runtime-Transformation
- Neue Build-Pipeline transformiert `index.json` → `index.transformed.json` zur Build-Zeit
- Pre-transformierte Such-Indizes (O(1) Lookups) statt Runtime-Berechnung
- Automatische Daten-Validierung vor jedem Build verhindert fehlerhafte Deployments

**Technische Details:**
- Neue Scripts in `scripts/`:
  - `transform-index.ts` - Transformiert Rohdaten in optimierte Such-Struktur
  - `validate-data.ts` - Validiert KFZ-Codes und Koordinaten
  - `minify-json.ts` - Komprimiert JSON-Dateien
  - `generate-fallback.ts` - Erstellt comprehensive Offline-Fallback
  - `build-data.ts` - Orchestriert alle Build-Schritte

#### Smart Caching Strategy
- **Version-basierte Cache-Invalidierung** mit `dataVersion` und `buildHash`
- **TTL-Support** für optionale Daten (30 Tage für seats.json, code-details.json)
- **HTTP 304 Not Modified** Support via `If-None-Match` Headers
- Automatische Cache-Migration bei Schema-Änderungen

### 🔔 Neue Features

#### PWA Update-Benachrichtigungen
- **UpdateBanner** erscheint automatisch bei verfügbaren Updates
- **Manueller Update-Check** in den Einstellungen
- Zeigt aktuelle und verfügbare Datenversion an
- "Jetzt aktualisieren" / "Später" Optionen für Nutzer
- Graceful Offline-Handling (Update-Check deaktiviert ohne Internet)

**Neue Komponenten:**
- `src/contexts/UpdateContext.tsx` - Zentrales Update State Management
- `src/components/UpdateBanner.tsx` - Bottom-Banner Notification UI
- Integration in `src/main.tsx` und `src/App.tsx`

#### Comprehensive Offline-Fallback
- **366 Districts statt 16** im Offline-Fallback
- Sofortige Funktionalität ohne Netzwerk
- Auto-generiertes TypeScript-Modul (`src/data/generated-fallback.ts`)
- Bundle-Size Impact: +98.7 KB (akzeptabel für vollständige Offline-Funktionalität)

### 🔧 Technische Verbesserungen

#### Schema-Versionierung & Migration
- **DistrictFeatureV2** Interface für zukünftige Erweiterungen definiert
- Optionale Felder für:
  - `kreisstadt` - Name der Kreisstadt
  - `kreisstadtCoords` - Koordinaten der Kreisstadt
  - `population` - Einwohnerzahl
  - `areaKm2` - Fläche in km²
  - `bundesland` / `bundeslandName` - Bundesland-Informationen
  - `website` - Website der Kreisverwaltung
  - `wikidataId` - Wikidata-Integration

- **Automatischer Migrations-Handler** (`migrateDataSchema()`)
  - Erkennt alte Cache-Formate (districts array vs. transformed index)
  - Erkennt fehlende Pflichtfelder (codeToIds, features)
  - Erkennt pre-versionierte Caches (ohne dataVersion)
  - Löscht inkompatible Caches automatisch → triggert Refetch

#### IndexedDB Schema v3
- Neue Felder in `CachedDataEntry`:
  - `dataVersion` - Build-timestamp für Versions-Tracking
  - `buildHash` - SHA-256 Hash der Quelldaten
  - `expiresAt` - Ablaufdatum für TTL-Support
- Migration von v2 → v3 automatisch via Dexie

### 📚 Dokumentation

#### Neue Dokumentations-Dateien
- **`docs/DATA_SCHEMA.md`** - Umfassende Entwickler-Dokumentation:
  - Schema-Übersicht und Datenfluss
  - Schritt-für-Schritt Anleitung zum Hinzufügen neuer Felder
  - Migrations-Strategie
  - Best Practices & Anti-Patterns
  - Praktische Beispiele (Kreisstadt, Population, Bundesland)
  - Troubleshooting-Guide
  - Schema Version History (v1 → v2 Migration Path)

- **`CLAUDE.md`** - Aktualisiert mit:
  - Build-Pipeline Beschreibung
  - Kritische Dateien und deren Rolle
  - Datenformat-Hinweise
  - Konfigurations-Anforderungen

### 🐛 Bug Fixes

- **Fixed:** Ungültiges KFZ-Kennzeichen "SPa" → "SPA" in `index.json` (Landkreis Tuttlingen)
  - Entdeckt durch automatische Validierung
  - Verhindert zukünftige Format-Fehler durch Pre-Build Validation

- **Fixed:** TypeScript Linting-Fehler in Migration Handler
  - Ersetzt `any` durch `Record<string, unknown>`
  - Verwendet Type Guards (`in` Operator) statt direktem Property-Access

### 🔄 Geändert

#### Breaking Changes
**KEINE** - Alle Änderungen sind abwärtskompatibel!

#### Daten-Pipeline
- **`public/data/index.transformed.json`** (NEU) - Pre-transformierte Daten
  - Ersetzt Runtime-Transformation in `useKfzData.ts`
  - Enthält `dataVersion` und `buildHash` Metadaten
  - 52.8 KB (minified)

- **`src/data/generated-fallback.ts`** (NEU) - Auto-generiert
  - Comprehensive Fallback mit allen 366 Districts
  - 98.7 KB TypeScript Modul
  - Wird bei jedem Build neu generiert

#### Geänderte Dateien
- `src/hooks/useKfzData.ts`:
  - **Entfernt:** `transformToKfzIndex()` Funktion (43 Zeilen)
  - **Entfernt:** `RawDistrict` und `RawIndexData` Interfaces
  - **Geändert:** Lädt `/data/index.transformed.json` statt `/data/index.json`
  - **Neu:** Version-Checking mit `getCacheMetadata()`
  - **Neu:** Migration Handler Integration
  - **Neu:** TTL für seats und code-details (30 Tage)
  - **Neu:** Verwendet `GENERATED_FALLBACK` statt `FALLBACK_INDEX`

- `src/lib/storage.ts`:
  - **Neu:** Schema v3 mit Version-Metadaten
  - **Neu:** `getCacheMetadata()` Funktion
  - **Neu:** `migrateDataSchema()` Funktion
  - **Erweitert:** `getCachedData()` mit Expiration-Check
  - **Erweitert:** `setCachedData()` mit TTL und Version-Support

- `src/data/schema.ts`:
  - **Neu:** `dataVersion` und `buildHash` Felder in `KfzIndex`
  - **Neu:** `DistrictFeatureV2` Interface für Schema-Erweiterungen

- `package.json`:
  - **Geändert:** Name: `vite_react_shadcn_ts` → `kfzlotti-explorer`
  - **Geändert:** Version: `0.0.0` → `1.0.0`
  - **Neu:** `prebuild` Script (läuft vor jedem Build)
  - **Neu:** `build:data` Script
  - **Neu:** `validate:data` Script

### 📊 Metriken

#### Performance
| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| App-Start (Cold) | 300-500ms | 100-300ms | **~200ms** ⚡ |
| Cache-Load | 50-150ms + Transform | < 100ms | **~100ms** |
| Offline Districts | 16 Städte | 366 Kreise | **+350 Districts** |
| Transform-Overhead | 150-300ms | 0ms | **100% eliminiert** |

#### Bundle Size
| Datei | Größe | Gzipped | Hinweis |
|-------|-------|---------|---------|
| Main Bundle | 320 KB | 103 KB | Keine signifikante Änderung |
| index.transformed.json | 52.8 KB | - | Neu, ersetzt Runtime-Transformation |
| generated-fallback.ts | 98.7 KB | im Bundle | +98.7 KB für vollständige Offline-Support |
| **Total PWA Cache** | 1025 KB | - | 38 Dateien precached |

#### Build-Zeit
| Phase | Dauer | Hinweis |
|-------|-------|---------|
| Data Build | 0.14s | Validation + Transform + Fallback + Minify |
| Vite Build | 3.68s | Keine signifikante Änderung |
| **Total** | ~3.8s | +0.14s für Daten-Pipeline |

### 🔐 Sicherheit

- Content Security Policy (CSP) konfiguriert
- Keine XSS-Vulnerabilities durch Input-Validierung
- Sichere Service Worker Konfiguration
- Keine Secrets in gecachten Daten

### 🌐 Kompatibilität

- **Browser:** Moderne Browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **PWA:** Vollständig installierbar auf Desktop und Mobile
- **Offline:** Funktioniert komplett ohne Internet (366 Districts)
- **Responsive:** Optimiert für Desktop, Tablet und Mobile

### 🛠️ Entwickler-Erfahrung

- **Neue Scripts:**
  ```bash
  bun run build:data      # Daten-Pipeline ausführen
  bun run validate:data   # Nur Validierung
  ```

- **Automatisierung:**
  - `prebuild` Hook führt Daten-Pipeline vor jedem Build aus
  - Keine manuelle Intervention nötig
  - Fehlerhafte Daten blockieren Build

- **Dokumentation:**
  - `docs/DATA_SCHEMA.md` für Schema-Erweiterungen
  - Inline-Kommentare in kritischen Funktionen
  - TypeScript Typen dokumentieren Datenstrukturen

### ⚠️ Bekannte Einschränkungen

- **Bundle-Size:** +98.7 KB durch comprehensive Fallback (Trade-off für Offline-Support)
- **Browser-Support:** Keine IE11 Unterstützung (moderne Browser erforderlich)
- **PWA-Installation:** Benötigt HTTPS in Production (Development: localhost ok)

### 🚀 Migration von 1.x → 2.0.0

**Für Nutzer:** Keine Aktion erforderlich
- Cache wird automatisch migriert
- Update-Banner erscheint bei verfügbarem Update
- Ein Klick auf "Jetzt aktualisieren" genügt

**Für Entwickler:** Keine Breaking Changes
- Alle APIs bleiben gleich
- Neue Features sind opt-in
- Schema-Erweiterungen sind optional

### 🎯 Nächste Schritte

Für die vollständige Roadmap mit geplanten Features siehe **[ROADMAP.md](ROADMAP.md)**.

**Highlights der kommenden Releases:**
- **v2.4.0:** Location-Based Features (Entfernungsanzeige, lokaler Quiz-Modus)
- **v2.5.0:** Interactive Map Features (Deutschland-Karte, geografisches Quiz)
- **v2.6.0:** Educational Data & Statistics (Bevölkerung, Größenvergleiche)

### 👥 Mitwirkende

Diese Release wurde entwickelt mit Unterstützung von Claude Code (Anthropic).

### 📝 Lizenz

- **Projekt:** EUPL 1.2
- **Geodaten:** © GeoBasis-DE / BKG (dl-de/by-2-0)
- **KFZ-Daten:** CC BY-SA 4.0

---

## [2.1.0] - 2025-12-30

**🌐 Offline-First & Mobile UX Release**

Diese Version macht KFZlotti zu einer echten Offline-First PWA mit komplett selbst-gehosteten Ressourcen und verbesserten Touch-Interaktionen für mobile Geräte.

### ✨ Neue Features

#### Offline-Modus
- **Einstellung in Settings** zum vollständigen Deaktivieren aller Netzwerk-Anfragen
- **WiFi-Icon** zeigt Offline-Status auch bei aktiviertem Offline-Modus
- **useKfzData** respektiert Offline-Modus und nutzt ausschließlich gecachte Daten
- **UpdateContext** prüft Offline-Modus vor Version-Checks
- Perfekt für Nutzer ohne Internet oder mit Datensparen-Modus

#### Self-Hosted Fonts
- **Fredoka & Nunito** komplett lokal gehostet (alle Gewichte: 400, 500, 600, 700)
- **Download-Script** (`scripts/download-fonts.ts`) für einfache Font-Updates
- **Keine externe Abhängigkeiten** mehr - 100% offline-fähig
- **CSP aktualisiert**: `font-src 'self'` (Google Fonts entfernt)
- Bundle-Impact: ~696 KB für vollständige Offline-Funktionalität

### 🎨 Mobile UX-Verbesserungen

#### Touch-Optimierungen
- **Floating Action Button (FAB)** im Quiz auf Mobile (< 768px)
  - Erscheint nach Beantwortung der Frage
  - Fixed Position bottom-right
  - Desktop behält originalen Button
- **Touch-optimierte Badge-Interaktionen**
  - Visuelle Indikatoren (ⓘ Icon, dashed border)
  - Desktop: Tooltips on hover
  - Mobile: Tap öffnet AlertDialog mit Details
- **Toast-Benachrichtigungen** mit sichtbarem Close-Button (opacity 70%)
- **Focus-State Fix** im Battle Quiz (blur() vor Fragenwechsel)
- **Global Touch-Optimization** via `touch-action: manipulation`
  - Verhindert versehentliche Auslöser beim Wischen/Scrollen
  - Entfernt 300ms Tap-Delay

### 🔧 Technische Änderungen

#### Neue Dateien
- `scripts/download-fonts.ts` - Automatisches Download-Script für Google Fonts
- `src/fonts.css` - @font-face Definitionen für lokale Fonts
- `public/fonts/` - 8 Font-Dateien (fredoka/nunito: 400, 500, 600, 700)

#### Geänderte Dateien
- `src/data/schema.ts`: `offlineMode?: boolean` zu UserSettings hinzugefügt
- `src/pages/Settings.tsx`: Offline-Modus Toggle mit Switch-Komponente
- `src/hooks/useKfzData.ts`: Offline-Modus Checks vor allen Fetch-Requests
- `src/contexts/UpdateContext.tsx`: Offline-Modus respektieren
- `src/pages/Index.tsx`: WiFi-Icon zeigt Offline bei aktiviertem Modus
- `index.html`: Google Fonts Links entfernt, CSP bereinigt
- `scripts/fix-production-csp.ts`: Production CSP ohne Google Fonts Domains
- `src/index.css`: Font-Import + touch-action: manipulation

### 📊 Bundle-Size Impact

| Ressource | Größe | Hinweis |
|-----------|-------|---------|
| Fredoka Fonts (4 weights) | ~192 KB | Lokal gehostet |
| Nunito Fonts (4 weights) | ~492 KB | Lokal gehostet |
| fonts.css | 2 KB | @font-face Definitionen |
| **Total** | ~686 KB | Trade-off für 100% Offline-Support |

### 🌐 Kompatibilität

- **Offline:** App funktioniert jetzt VOLLSTÄNDIG ohne Internet (Daten + Fonts)
- **Mobile:** Verbesserte Touch-Erfahrung auf iOS & Android
- **Desktop:** Keine Regression, alle Features funktionieren wie zuvor

### ⚠️ Breaking Changes

**KEINE** - Alle Änderungen sind abwärtskompatibel!

---

## [Unreleased]

Keine unveröffentlichten Änderungen.

---

## Versions-Historie (Pre-2.0)

### [1.0.0] - 2024-12-29

**Initial Production Release**
- Basis-Funktionalität: KFZ-Suche
- Quiz-Modi (Normal, Battle, Fehlerkorrektur)
- Vorbereitung für eine Interaktive Karte mit TopoJSON
- PWA mit Service Worker
- Limitierter Offline-Fallback (16 Städte)
- Runtime-Transformation (Performance-Bottleneck)
- Dark Mode
- Gamification (Badges, Streaks)

---

[2.3.1]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.3.1
[2.3.0]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.3.0
[2.2.1]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.2.1
[2.2.0]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.2.0
[2.1.0]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.1.0
[2.0.0]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v2.0.0
[1.0.0]: https://github.com/ndrstmr/kfzlotti-explorer/releases/tag/v1.0.0
