# 🗺️ KFZlotti Roadmap

**Aktueller Stand:** v2.3.1 (2025-12-31)

---

## Vision

KFZlotti soll die **umfassendste und lehrreichste** deutsche KFZ-Kennzeichen-App werden - mit interaktiven Karten, location-based Features und spielerischen Lernmodi für Kinder und Erwachsene.

---

## 🚀 Nächste Releases

### v2.4.0 - Location-Based Features 📍

**Ziel:** Persönliche Relevanz durch Standort-Integration

#### Kern-Features:
1. **"Wo bin ich? Wo ist das?"**
   - Aktuelle Position auf Karte anzeigen (mit Geolocation-Permission)
   - Gesuchter Kreis auf Karte highlighten
   - Beide gleichzeitig sichtbar → räumlicher Kontext

2. **Entfernungsanzeige**
   - Luftlinie vom aktuellen Standort zur Kreismitte
   - "Du bist X km von [Kreis] entfernt"
   - Kindgerechte Vergleiche: "So weit wie 100 Fußballfelder"

3. **Lokaler Quiz-Modus**
   - "Bundesland-Quiz": Nur Kreise aus dem aktuellen Bundesland
   - Automatische Erkennung: In welchem Bundesland bin ich?
   - Fortschritt: "5/12 Kreise in Bayern gelernt"

#### Technische Basis:
- Geolocation API (bereits vorhanden in `useGeolocation.ts`)
- TopoJSON Shapes für Kreis-Polygone
- Haversine-Formel für Entfernungsberechnung
- Bundesland-Zuordnung aus ARS-Code

#### Daten benötigt:
- ✅ Kreis-Zentren (bereits in `index.json`: `center: [lat, lng]`)
- ❌ TopoJSON Geometrien (aktuell leer - **DATA-01 aus TODO**)
- ❌ Bundesland-Polygone für "Bin ich in...?"-Check

---

### v2.5.0 - Interactive Map Features 🗺️

**Ziel:** Vollständige Karten-Integration mit edukativem Fokus

#### Kern-Features:
1. **Deutschland-Karte Overlay**
   - Alle Kreise als anklickbare Shapes
   - Farbcodierung nach Bundesland
   - Zoom & Pan (Leaflet/react-leaflet)
   - Mobile-optimiert (Touch-Gesten)

2. **Geografisches Quiz**
   - "Wo liegt dieser Kreis?" → Auf Karte tippen
   - Feedback: "50km daneben - versuch's nochmal!"
   - Schwierigkeitsgrade: Bundesland → Nachbar-Bundesländer → ganz Deutschland

3. **Kennzeichen-Heatmap**
   - Visualisierung: Wie viele Codes hat jedes Bundesland?
   - Interaktiv: Tap auf Bundesland → Liste aller Codes
   - "Wusstest du? NRW hat die meisten Kreise!"

4. **Nachbar-Kreise**
   - Shape-Topology nutzen: Welche Kreise grenzen an?
   - "Entdecke die Nachbarn von [Kreis]"
   - Quiz-Modus: "Welcher Kreis grenzt an X?"

#### Technische Basis:
- Leaflet mit TopoJSON-Layer
- `topojson-client` für Shape-Rendering
- Touch-optimierte Marker & Polygone
- Offline-Caching für Map-Tiles (optional)

#### Daten benötigt:
- ❌ Vollständige TopoJSON mit Geometrien (**kritisch!**)
- ❌ Tile-Server für Basemap (OpenStreetMap Tiles)
- ❌ Nachbar-Beziehungen (aus Shape-Topology generieren)

---

### v2.6.0 - Educational Data & Statistics 📊

**Ziel:** Lernen durch Daten und Vergleiche

#### Kern-Features:
1. **Kreisstadt-Daten**
   - Hauptstadt jedes Kreises anzeigen
   - Marker auf Karte
   - "Wie heißt die Kreisstadt von [Code]?"

2. **Größenvergleiche**
   - Fläche in km² (aus Statistisches Bundesamt)
   - Vergleiche: "So groß wie 5.000 Fußballfelder"
   - Ranking: "Top 10 größte/kleinste Kreise"

3. **Bevölkerungsdaten**
   - Einwohnerzahl pro Kreis
   - Bevölkerungsdichte visualisieren (Heatmap)
   - "Wusstest du? [Kreis] hat X Einwohner"

4. **Filter & Sortierung**
   - Nach Bundesland filtern
   - Nach Größe/Bevölkerung sortieren
   - "Zeige nur Kreise > 1.000 km²"

#### Technische Basis:
- Datenquelle: Statistisches Bundesamt (Destatis)
- Schema-Erweiterung: `population`, `area_km2`, `kreisstadt`
- Lazy-Loading für optionale Daten
- Visualisierung mit `recharts`

#### Daten benötigt:
- ❌ Destatis Bevölkerungs-CSV
- ❌ Flächen-Daten (km²)
- ❌ Kreisstadt-Koordinaten (für Marker)

---

### v2.7.0 - Advanced Features & Gamification 🎮

**Ziel:** Langzeit-Motivation durch Achievements und Story

#### Kern-Features:
1. **"Reise durch Deutschland"**
   - Starte in deinem Kreis
   - Reise nur über angrenzende Kreise
   - Ziel: Von Nord nach Süd (oder individuell)
   - Achievements: "Deutschland-Durchquerer"

2. **Historische Kennzeichen**
   - DDR-Kreise & alte Codes
   - "Was war früher [Code]?"
   - Timeline-Visualisierung

3. **Wikidata-Integration**
   - Links zu Wikipedia-Artikeln
   - Wappen der Kreise
   - Interessante Fakten (Auto-generiert)

4. **Multiplayer-Modus**
   - Lokaler Wettkampf (geteilter Screen)
   - Online-Ranglisten (optional, mit Datenschutz)
   - "Wer kennt mehr Kreise in 60 Sekunden?"

#### Technische Basis:
- Wikidata SPARQL API
- WebRTC für lokalen Multiplayer (optional)
- IndexedDB für Reise-Fortschritt
- Graph-Algorithmen für Nachbar-Pfade

#### Daten benötigt:
- ❌ Wikidata Entity IDs für Kreise
- ❌ Historische Kennzeichen-Datenbank
- ❌ Wappen-Bilder (CC-lizenziert)

---

## 🛠️ Technische Roadmap

### Daten-Pipeline (Priorität: Hoch)
- [ ] **TopoJSON Generierung**
  - Script: `scripts/generate-topojson.ts`
  - Input: OpenGeoDB Shapes oder BKG GeoBasis-DE
  - Output: `public/data/kfz250.topo.json` (mit Geometrien!)
  - Simplification für Mobile (TopoJSON → 500KB statt 5MB)

- [ ] **Destatis Integration**
  - Script: `scripts/fetch-destatis.ts`
  - Quellen: Genesis-Online API (Destatis)
  - Daten: Bevölkerung, Fläche, Kreisstadt
  - Output: `public/data/statistics.json`

- [ ] **Shape-Topology Analyzer**
  - Script: `scripts/analyze-neighbors.ts`
  - Input: TopoJSON mit Geometrien
  - Output: `public/data/neighbors.json` (Adjazenz-Matrix)

### Code-Qualität (gemäß TODO-Liste)
- [ ] **ARCH-01:** SW Cache-Strategie fixen (🔴 Critical)
- [ ] **DATA-01:** TopoJSON Validierung (🔴 Critical)
- [ ] **TEST-01:** Test-Suite erweitern (🟠 High)
- [ ] **ARCH-02:** useKfzData refactoren (🟠 High)
- [ ] **A11Y-01-03:** Accessibility verbessern (🟡 Medium)

### Performance-Optimierungen
- [ ] **Web Worker** für TopoJSON-Parsing (PERF-03)
- [ ] **Lazy Loading** für Map-Komponenten
- [ ] **Tile-Caching** für Offline-Karte
- [ ] **Progressive Enhancement:** Karte nur wenn Geodaten verfügbar

---

## 📅 Zeitplan (grobe Schätzung)

| Version | ETA | Fokus |
|---------|-----|-------|
| **v2.3.1** | ✅ 2025-12-31 | Universal Deployment & Bug Fixes |
| **v2.4.0** | Q1 2025 | Location-Based Features |
| **v2.5.0** | Q2 2025 | Interactive Map |
| **v2.6.0** | Q3 2025 | Educational Data |
| **v2.7.0** | Q4 2025 | Advanced Features |
| **v3.0.0** | 2026 | Major Rewrite (TBD: React 19, Server Components?) |

---

## 🎯 Milestones

### Milestone 1: "Karten-MVP" (v2.4.0)
- [x] Geolocation funktioniert (bereits vorhanden)
- [ ] TopoJSON mit echten Geometrien
- [ ] "Wo bin ich?"-Marker auf Karte
- [ ] Entfernungsberechnung
- [ ] Lokaler Quiz-Modus

### Milestone 2: "Vollständige Karte" (v2.5.0)
- [ ] Alle Kreise anklickbar
- [ ] Bundesland-Filter
- [ ] Geografisches Quiz
- [ ] Nachbar-Kreise-Feature

### Milestone 3: "Daten-Paradies" (v2.6.0)
- [ ] Bevölkerungs-Daten integriert
- [ ] Größenvergleiche visualisiert
- [ ] Kreisstadt-Marker auf Karte
- [ ] Filter & Sortierung

### Milestone 4: "Gamification" (v2.7.0)
- [ ] Reise-Modus funktionsfähig
- [ ] Historische Daten verfügbar
- [ ] Wikidata-Links
- [ ] Multiplayer-Option

---

## 💡 Feature-Ideen (Backlog)

**Noch nicht geplant, aber interessant:**

### Edukativ:
- **Kennzeichen-Rätsel:** "Welches Kennzeichen beginnt mit diesem Buchstaben?"
- **Bundesland-Bingo:** Alle Codes eines Bundeslandes finden
- **Geschichte-Modus:** Wie haben sich Kreise verändert? (Gebietsreformen)
- **Wappen-Quiz:** Wappen erraten (aus Wikidata)

### Technisch:
- **Offline-Map-Tiles:** Map-Tiles in Service Worker pre-cachen
- **AR-Modus:** Kamera auf Nummernschild → Code erkennen (OCR)
- **Sprach-Ausgabe:** Vorlesen für Kinder (Web Speech API)
- **Export:** Meine Fortschritt als PDF/Bild teilen

### Social:
- **Teilen-Feature:** "Ich habe alle Codes in Bayern gelernt! 🎉"
- **Challenge-Modus:** "Lerne 10 Codes in 5 Minuten"
- **Leaderboard:** Anonyme Rangliste (opt-in, DSGVO-konform)

---

## 📚 Datenquellen

### Aktuell genutzt:
- ✅ **KFZ-Codes:** Wikipedia (CC BY-SA 4.0)
- ✅ **Kreis-Namen:** OpenGeoDB (diverse Lizenzen)
- ✅ **Bundesländer:** Eigene Datenbank (`src/data/bundeslaender.ts`)

### Geplant:
- ❌ **Geodaten:** GeoBasis-DE / BKG (dl-de/by-2-0)
- ❌ **Statistiken:** Destatis Genesis-Online (Open Data)
- ❌ **Wikidata:** Wikidata SPARQL (CC0)
- ❌ **Map-Tiles:** OpenStreetMap (ODbL)
- ❌ **Historisch:** Wikipedia (CC BY-SA 4.0)

---

## 🤝 Community-Beiträge

**Was fehlt dir?** Issues & PRs willkommen!

- 🗺️ **Shape-Daten:** Hast du bessere TopoJSON-Quellen?
- 📊 **Statistiken:** Kennst du gute Destatis-APIs?
- 🎨 **Design:** UI/UX-Verbesserungen?
- 🧪 **Tests:** Hilf uns die Test-Coverage zu erhöhen!

---

**Letzte Aktualisierung:** 2025-12-31
**Maintainer:** [@ndrstmr](https://github.com/ndrstmr)
