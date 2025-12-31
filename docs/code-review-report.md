# KFZlotti PWA – Umfassender Code-Review

## 1. Executive Summary
- Offline-First-Strategie vorhanden (Service Worker, IndexedDB, Fallback), aber Geo-/Seats-Daten sind leer und werden dennoch gecacht → Kernfunktionen offline unvollständig.【F:src/hooks/useKfzData.ts†L89-L130】【F:public/data/kfz250.topo.json†L1-L1】
- Suchlogik normalisiert Eingaben solide (Trim, Uppercase, Umlaut-Support, Dedupe) und ist durch Tests abgedeckt.【F:src/lib/normalize.ts†L13-L47】【F:src/lib/normalize.test.ts†L9-L47】
- PWA-Konfiguration precached `/data/*.json` ohne Version-Pinning; Workbox nutzt CacheFirst für Daten mit 30 Tagen TTL, aber keine ETag-Validierung im SW → potenziell stale Daten bis Reload.【F:vite.config.ts†L16-L59】
- Geolocation ist nur auf User-Aktion ausgelegt, mit kindgerechten Fehlermeldungen; Datenschutzfreundlich umgesetzt.【F:src/hooks/useGeolocation.ts†L16-L110】
- Barrierefreiheit/A11y: Eingabefeld mit Labels, Offline/Online-Status klar; aber Quick-Buttons ohne aria-labels und fehlende Fokusführung in ResultCards-Dialogen.【F:src/pages/Index.tsx†L112-L126】【F:src/components/ResultCards.tsx†L43-L109】
- Tests existieren für Normalisierung und Suche, aber keine für Daten-Loader, IndexedDB-Migration oder PWA-Logik → kritische Pfade ungetestet.【F:src/lib/normalize.test.ts†L1-L95】【F:src/lib/search.test.ts†L1-L126】
- Sicherheitslage: keine Tracker/externen API-Calls; Dexie-Speicherung ohne Encryption, Service Worker sofort `skipWaiting`/`clientsClaim` → möglicher SW-Swap mitten in Session.【F:vite.config.ts†L24-L59】
- Wartbarkeit: klare Modulgrenzen (lib, hooks, pages) und Schema-Doku; jedoch reale Datensätze fehlen (Topo/Seats leer), was Build/Runtime inkonsistent macht.【F:docs/DATA_SCHEMA.md†L15-L65】【F:public/data/kfz250.topo.json†L1-L1】
- Performance: Data-Files klein, aber TopoJSON leer; Fallback (~100KB) wird immer mitgebundled → initial payload größer, keine Code-Splitting für Kartenkomponenten (nicht vorhanden).【F:src/data/generated-fallback.ts†L1-L1】
- Lizenz/Attribution: LICENSE vorhanden (EUPL 1.2), Impressums-Reminder eingebaut, aber keine explizite Datenquellen-Seite im UI.【F:LICENSE†L1-L10】【F:src/pages/Index.tsx†L49-L72】

## 2. Definition-of-Done Check
- Offline-First: **Teilweise** – SW & Fallback vorhanden, aber Geo/Seats-Daten leer und Cache-Invalidierung nur clientseitig.【F:src/hooks/useKfzData.ts†L89-L156】【F:public/data/kfz250.topo.json†L1-L1】
- Datenschutz: **Besteht** – keine Tracker, Geolocation opt-in mit klaren Meldungen.【F:src/hooks/useGeolocation.ts†L16-L110】
- Performance: **Teilweise** – geringe Datenlast, aber unnötige Fallback-Last und mögliche stale Caches (CacheFirst ohne Versionierung).【F:vite.config.ts†L16-L59】【F:src/data/generated-fallback.ts†L1-L1】
- Testabdeckung: **Fällt durch** – zentrale Loader/PWA/Storage-Pfade ungetestet; nur Normalize/Search abgedeckt.【F:src/lib/normalize.test.ts†L1-L95】【F:src/lib/search.test.ts†L1-L126】
- A11y: **Teilweise** – Basis-ARIA vorhanden, aber Fokus-Management in Dialogen und Button-Labels für Kinder-Bedienung fehlen.【F:src/components/ResultCards.tsx†L43-L109】【F:src/pages/Index.tsx†L172-L186】

## 3. Findings-Tabelle
| ID | Severity | Bereich | Beschreibung | Evidence | Fix-Vorschlag |
| --- | --- | --- | --- | --- | --- |
| F1 | High | Offline | TopoJSON `kfz250.topo.json` enthält keine Geometrien → Karte/Polygon-Funktionen offline/online wirkungslos. | 【F:public/data/kfz250.topo.json†L1-L1】 | Datenfile mit realen Geometrien einchecken oder Download-Flow implementieren; SW precache/CacheFirst prüfen. |
| F2 | High | Offline | Seats- und Topo-Daten trotz Leerinhalt via CacheFirst geladen und gecacht → falsche Annahme „Offline ready“. | 【F:src/hooks/useKfzData.ts†L89-L114】 | Vor Cache-Write Validierung auf Nicht-Leer-Inhalt; Fallback für Geometrie ergänzen. |
| F3 | High | Funktion | `searchKfzCode` nutzt `codeToIds` ohne Fallback bei fehlenden Features → leeres Ergebnis bei inkonsistenten Daten. | 【F:src/lib/search.ts†L25-L55】 | Guard: wenn `feature` fehlt, Fehler loggen und Ergebnis mit Platzhalter („Daten fehlen“) zurückgeben. |
| F4 | Medium | Offline | Service Worker CacheFirst für `/data/*.json` ohne Versions-/ETag-Abgleich → 30 Tage stale möglich. | 【F:vite.config.ts†L24-L59】 | Cache-Keys mit `dataVersion`/`buildHash` oder `StaleWhileRevalidate` + `cacheWillUpdate` implementieren. |
| F5 | Medium | Security | SW `skipWaiting` + `clientsClaim` aktiviert → Update-Swap mitten in Session möglich. | 【F:vite.config.ts†L28-L30】 | Nutzerfreundlichen Update-Flow verwenden (postMessage + UI-Banner, erst nach Confirmation aktivieren). |
| F6 | Medium | Tests | Keine Tests für `useKfzData`/Dexie-Migration → Risiko defekter Offline-Caches. | 【F:src/hooks/useKfzData.ts†L35-L188】【F:src/lib/storage.ts†L1-L188】 | Vitest + Dexie-mock hinzufügen: Cache-Migration, Offline-Mode, Fehlerfälle. |
| F7 | Medium | Perf | Fallback-Daten (`generated-fallback.ts` ~100KB) werden immer gebundled, auch wenn echte Daten verfügbar. | 【F:src/data/generated-fallback.ts†L1-L1】【F:src/hooks/useKfzData.ts†L132-L160】 | Lazy import des Fallbacks nur bei Bedarf oder separater chunk. |
| F8 | Medium | A11y | Quick-Buttons („B“, „HH“ etc.) ohne explizite `aria-label` → Screenreader spricht nur Buchstaben. | 【F:src/pages/Index.tsx†L172-L185】 | `aria-label` mit Kontext („Kennzeichen B suchen“) ergänzen. |
| F9 | Medium | A11y | AlertDialog in ResultCards öffnet ohne Fokussteuerung/Close-Button Fokus-Management für Kids. | 【F:src/components/ResultCards.tsx†L70-L109】 | `AlertDialogAction` + Fokus-Return hinzufügen, Trigger per Tastatur erreichbar machen. |
| F10 | Medium | Funktion | Keine Anzeige für „Daten beschädigt/fehlen“ bei Topo/Seats – nur generischer Error; Nutzer glaubt an vollständige Ergebnisse. | 【F:src/hooks/useKfzData.ts†L137-L158】 | UI-Badge „Karte offline/nicht verfügbar“ anzeigen wenn `topoJson` null. |
| F11 | Low | Security | Dexie speichert personenbezogene Einstellungen/Progress unverschlüsselt; kein Data Retention Hinweis. | 【F:src/lib/storage.ts†L1-L207】 | Hinweis in UI + Option „Alle Daten löschen“ prominenter; Evaluieren Crypto-Keys. |
| F12 | Low | Perf | `useKfzData` lädt alle optionalen Dateien beim Online-Start (code-details, seats) ohne Lazy-Trigger → unnötige Netzlast. | 【F:src/hooks/useKfzData.ts†L89-L130】 | Optionaldaten on-demand laden (z.B. beim Öffnen von Karte/Details). |
| F13 | Low | Arch | Keine zentrale Error-Codes/Types für Loader; Strings verstreut → Übersetzung/Test schwer. | 【F:src/hooks/useKfzData.ts†L135-L158】 | Error enums + i18n strukturieren. |
| F14 | Low | License | README verweist auf `[YOUR-DOMAIN]` und keine Datenquellen-Attribution im UI. | 【F:README.md†L9-L36】 | Info-Seite mit Lizenz/Quelle (z.B. OpenGeoDB) ergänzen; Domain-Platzhalter ersetzen. |
| F15 | Low | Perf | React Query Client ohne cacheTime/GC-Settings -> Default 5 Minuten; aber Daten auch in Dexie → doppelter Speicher. | 【F:src/App.tsx†L6-L33】 | QueryClient mit `cacheTime: 0` oder Nutzung entfernen falls ungenutzt. |
| F16 | Low | UX | InstallHint/Status nicht sichtbar wenn SW noch nicht aktiv → kein „Offline bereit“-Signal. | 【F:src/main.tsx†L7-L33】【F:src/pages/Index.tsx†L198-L205】 | UpdateBanner erweitern: SW-Status + Offline-Cache-Progress anzeigen. |

## 4. Quick Wins (≤ 2h)
- `useKfzData`: Vor dem Cachen prüfen, ob Topo/Seats-Response nicht leer; ansonsten Fallback setzen und UI-Flag „Karte nicht verfügbar“ anzeigen.【F:src/hooks/useKfzData.ts†L89-L156】
- ResultCards AlertDialog: `AlertDialogAction` + `role="dialog"`/Fokus-Return ergänzen, Quick-Buttons mit `aria-label` versehen.【F:src/components/ResultCards.tsx†L70-L109】【F:src/pages/Index.tsx†L172-L185】
- Service Worker: Cache-Strategie für `/data/*.json` auf `StaleWhileRevalidate` umstellen und `cacheName` mit `dataVersion` suffxen; reduziert stale-Daten-Risiko.【F:vite.config.ts†L24-L59】

## 5. Strategische Fixes (S/M/L)
- **S:** Echte Datenpakete (TopoJSON, seats) bereitstellen oder automatisierten Download-Build-Schritt reaktivieren; sonst fehlt Kernfunktion (Karten).【F:public/data/kfz250.topo.json†L1-L1】
- **M:** Test-Suite erweitern (Loader, Dexie-Migration, PWA update flow) mit Mocks; CI Gate für Offline-Funktionalität hinzufügen.【F:src/lib/storage.ts†L1-L207】【F:src/hooks/useKfzData.ts†L35-L188】
- **M:** UI-Feedback für Datenstatus/Offline-Ready und Versionierung (Anzeigen von `dataVersion`/`buildHash` im Info-Screen).【F:src/hooks/useKfzData.ts†L52-L83】【F:docs/DATA_SCHEMA.md†L15-L65】
- **L:** Refactor Daten-Ladefluss: Lazy-load optional data, progressive map loading, split fallback in separaten Chunk; evtl. background sync für Updates.【F:src/hooks/useKfzData.ts†L89-L160】【F:src/data/generated-fallback.ts†L1-L1】

## 6. Patch-Snippets
**Snippet 1 – CacheOnly if data non-empty & status badge**
```ts
// in useKfzData
if (topoResponse.ok) {
  const json = await topoResponse.json();
  if (json.objects?.kreise?.geometries?.length) {
    topoJson = json;
    await setCachedData(CACHE_KEYS.TOPO, topoJson);
  } else {
    console.warn('TopoJSON empty, skipping cache');
  }
}
```

**Snippet 2 – StaleWhileRevalidate for data**
```ts
// in vite.config.ts workbox.runtimeCaching
{
  urlPattern: /\/data\/.+\.json$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'kfz-data-cache-v${process.env.DATA_VERSION}',
    plugins: [new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [0,200]})],
  },
}
```

**Snippet 3 – A11y labels for quick buttons**
```tsx
{['B','HH','M','K','F'].map(code => (
  <Button
    key={code}
    aria-label={`Kennzeichen ${code} suchen`}
    ...
  >{code}</Button>
))}
```

## 7. Risiken & [Unverifiziert] Annahmen
- [Unverifiziert] Keine CVE-Prüfung der Dependencies durchgeführt; manuelles Audit empfohlen (npm audit nicht gelaufen).
- SW-Strategieänderung kann bestehende Caches invalidieren → Nutzern ggf. Hinweis geben.
- Datenquellen/Attribution nicht im UI sichtbar; rechtliche Risiken bei echten Daten, falls nicht ergänzt.
