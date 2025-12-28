# Beitragen zu KFZlotti

Danke, dass du dich für einen Beitrag zu KFZlotti interessierst! 🎉

Dieses Dokument beschreibt, wie du zum Projekt beitragen kannst.

## 📋 Inhaltsverzeichnis

- [Verhaltenskodex](#verhaltenskodex)
- [Wie kann ich beitragen?](#wie-kann-ich-beitragen)
- [Entwicklungsumgebung](#entwicklungsumgebung)
- [Code-Style](#code-style)
- [Issues erstellen](#issues-erstellen)
- [Pull Requests](#pull-requests)
- [Commit-Nachrichten](#commit-nachrichten)

## 🤝 Verhaltenskodex

Bitte sei respektvoll und konstruktiv in allen Interaktionen. Wir möchten eine einladende Community für alle schaffen.

## 💡 Wie kann ich beitragen?

### Fehler melden
- Prüfe zuerst, ob der Fehler bereits gemeldet wurde
- Erstelle ein Issue mit einer klaren Beschreibung
- Füge Schritte zur Reproduktion hinzu

### Features vorschlagen
- Öffne ein Issue mit dem Tag "Feature Request"
- Beschreibe den Anwendungsfall und den Mehrwert

### Code beitragen
- Behebe offene Issues
- Verbessere Dokumentation
- Füge Tests hinzu
- Optimiere Performance

### Daten verbessern
- Korrigiere fehlerhafte Kennzeichen-Zuordnungen
- Ergänze fehlende Informationen
- Aktualisiere veraltete Daten

## 🛠️ Entwicklungsumgebung

### Setup

```bash
# Repository forken und klonen
git clone https://github.com/DEIN-USERNAME/kfzlotti.git
cd kfzlotti

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Verfügbare Scripts

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet den Entwicklungsserver |
| `npm run build` | Erstellt den Produktions-Build |
| `npm run preview` | Zeigt den Build lokal an |
| `npm run lint` | Prüft den Code auf Fehler |

## 📝 Code-Style

### Allgemein

- **Sprache**: TypeScript für allen neuen Code
- **Formatierung**: Prettier mit Standardeinstellungen
- **Linting**: ESLint-Konfiguration folgen

### TypeScript

```typescript
// ✅ Gut: Explizite Typen für Props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ Gut: Funktionale Komponenten mit Arrow Functions
const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

// ❌ Vermeiden: any-Typ
const handleData = (data: any) => { ... }

// ✅ Besser: Konkrete Typen
const handleData = (data: KfzEntry) => { ... }
```

### React-Komponenten

```typescript
// ✅ Gut: Kleine, fokussierte Komponenten
// Eine Komponente = Eine Aufgabe

// ✅ Gut: Custom Hooks für wiederverwendbare Logik
const useKfzSearch = (query: string) => {
  // ...
};

// ✅ Gut: Komponenten in eigene Dateien
// src/components/SearchInput.tsx
// src/components/ResultCard.tsx
```

### Styling

```typescript
// ✅ Gut: Tailwind-Klassen mit Design-Tokens
<div className="bg-card text-foreground rounded-2xl p-4">

// ❌ Vermeiden: Hardcoded Farben
<div className="bg-white text-black">

// ✅ Gut: Responsive Design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Dateistruktur

```
src/
├── components/
│   ├── ui/           # Basis-Komponenten (shadcn)
│   └── FeatureName/  # Feature-spezifische Komponenten
├── hooks/            # Custom React Hooks
├── lib/              # Hilfsfunktionen
├── pages/            # Seiten-Komponenten
└── data/             # Typen und Schemas
```

## 🐛 Issues erstellen

### Bug Report

```markdown
## Beschreibung
Kurze Beschreibung des Fehlers.

## Schritte zur Reproduktion
1. Gehe zu '...'
2. Klicke auf '...'
3. Scrolle zu '...'
4. Fehler erscheint

## Erwartetes Verhalten
Was sollte passieren?

## Tatsächliches Verhalten
Was passiert stattdessen?

## Screenshots
Falls vorhanden.

## Umgebung
- Browser: [z.B. Chrome 120]
- Gerät: [z.B. iPhone 14, Desktop]
- OS: [z.B. iOS 17, Windows 11]
```

### Feature Request

```markdown
## Zusammenfassung
Kurze Beschreibung des Features.

## Motivation
Warum ist dieses Feature nützlich?

## Mögliche Lösung
Wie könnte es implementiert werden?

## Alternativen
Welche anderen Lösungen hast du erwogen?
```

## 🔀 Pull Requests

### Bevor du startest

1. Erstelle ein Issue für größere Änderungen
2. Warte auf Feedback, bevor du viel Zeit investierst
3. Forke das Repository

### PR erstellen

1. **Branch erstellen**
   ```bash
   git checkout -b feature/mein-feature
   # oder
   git checkout -b fix/bug-beschreibung
   ```

2. **Änderungen commiten** (siehe [Commit-Nachrichten](#commit-nachrichten))

3. **Push zum Fork**
   ```bash
   git push origin feature/mein-feature
   ```

4. **Pull Request öffnen**
   - Beschreibe die Änderungen klar
   - Verlinke das zugehörige Issue
   - Füge Screenshots hinzu (bei UI-Änderungen)

### PR-Checkliste

- [ ] Code folgt dem Style Guide
- [ ] Keine TypeScript-Fehler (`npm run build`)
- [ ] Lint-Prüfung bestanden (`npm run lint`)
- [ ] Dokumentation aktualisiert (falls nötig)
- [ ] CHANGELOG.md aktualisiert (bei Features)

### PR-Template

```markdown
## Beschreibung
Was wurde geändert und warum?

## Art der Änderung
- [ ] Bug Fix
- [ ] Neues Feature
- [ ] Breaking Change
- [ ] Dokumentation

## Zugehöriges Issue
Fixes #123

## Screenshots
(bei UI-Änderungen)

## Checkliste
- [ ] Ich habe meinen Code selbst reviewed
- [ ] Mein Code erzeugt keine neuen Warnungen
- [ ] Ich habe die Dokumentation aktualisiert
```

## 💬 Commit-Nachrichten

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/de/):

### Format

```
<typ>(<bereich>): <beschreibung>

[optionaler body]

[optionaler footer]
```

### Typen

| Typ | Beschreibung |
|-----|--------------|
| `feat` | Neues Feature |
| `fix` | Bug Fix |
| `docs` | Dokumentation |
| `style` | Formatierung (kein Code-Change) |
| `refactor` | Code-Refactoring |
| `perf` | Performance-Verbesserung |
| `test` | Tests hinzufügen/korrigieren |
| `chore` | Build-Prozess, Tools |

### Beispiele

```bash
feat(quiz): Schwierigkeitsgrad-Auswahl hinzugefügt

fix(suche): Umlaute werden jetzt korrekt erkannt

docs(readme): Installationsanleitung erweitert

refactor(hooks): useKfzData in kleinere Hooks aufgeteilt
```

---

## ❓ Fragen?

Bei Fragen erstelle ein Issue mit dem Tag "Question" oder kontaktiere uns per E-Mail.

Danke für deinen Beitrag! 🚗💨
