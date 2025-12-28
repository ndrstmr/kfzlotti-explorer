# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.0] - 2025-01-XX

### Hinzugefügt
- **Kennzeichen-Suche** – Schnelle Suche nach Kürzeln, Städten oder Landkreisen
- **Standort-Erkennung** – Automatische Erkennung des lokalen Kennzeichens via GPS
- **Interaktive Karte** – Visualisierung aller Landkreise mit TopoJSON und Leaflet
- **Quiz-Modus** – Lernspiel mit verschiedenen Schwierigkeitsgraden
- **Battle-Quiz** – Wettkampf-Modus für zwei Spieler
- **PWA-Unterstützung** – Installierbar auf Smartphone, funktioniert offline
- **Dark Mode** – Automatische Anpassung ans System-Theme
- **Offline-Caching** – Daten werden lokal gespeichert für schnellen Zugriff
- **Responsive Design** – Optimiert für Mobile und Desktop

### Technisch
- React 18 mit TypeScript
- Vite als Build-Tool
- Tailwind CSS für Styling
- shadcn/ui Komponenten-Bibliothek
- Leaflet für Kartenvisualisierung
- Dexie für IndexedDB-Caching
- Vite PWA Plugin für Service Worker

---

## Versionierung

- **MAJOR** (1.x.x): Inkompatible Änderungen
- **MINOR** (x.1.x): Neue Features, abwärtskompatibel
- **PATCH** (x.x.1): Bugfixes, abwärtskompatibel
