# Development Workflow

Dieser Workflow definiert klare Regeln für Commits, Releases und Build-Artefakte.

## 📋 Workflow für Feature/Bugfix Commits

**Verwendung:** Tägliche Entwicklung, Features, Bugfixes

```bash
1. Code implementieren
   - Änderungen in src/, public/, etc.
   - TypeScript types korrekt nutzen

2. Pre-Commit Hook läuft automatisch
   - ESLint prüft Code
   - Bei Fehler: Commit wird blockiert

3. Commit erstellen
   - Conventional Commits Format nutzen
   - Generierte Dateien NICHT committen (sind in .gitignore)

4. Pre-Push Hook läuft automatisch
   - ESLint prüft Code
   - Tests laufen (vitest)
   - Production Build wird getestet
   - Bei Fehler: Push wird blockiert

5. Push zu GitHub
   - CI/CD Pipeline läuft automatisch
   - Artifact wird erstellt
```

**Beispiel:**
```bash
# Feature implementieren
vim src/components/NewFeature.tsx

# Commit (Hook läuft automatisch)
git add src/components/NewFeature.tsx
git commit -m "feat(ui): Add new feature component"

# Push (Hook läuft automatisch)
git push
```

---

## 🚀 Workflow für Release Commits

**Verwendung:** Versionierung (v2.x.x)

```bash
1. Alle Features/Fixes fertig stellen
   - Keine offenen TODOs
   - Alle Tests erfolgreich

2. CHANGELOG.md aktualisieren
   - Neuen Versions-Eintrag hinzufügen
   - Features, Bugfixes, Breaking Changes dokumentieren
   - Datum eintragen

3. Version bumpen
   - package.json: "version": "2.x.x"
   - public/manifest.webmanifest: "version": "2.x.x"
   - src/config/site.ts: version: "2.x.x"

4. Production Build ausführen
   - `bun run build`
   - Generiert: public/data/index.transformed.json
   - Generiert: src/data/generated-fallback.ts

5. Generierte Dateien prüfen
   - Timestamps korrekt?
   - Daten vollständig?

6. Release-Commit mit generierten Dateien
   - `git add -A`
   - `git add -f public/data/index.transformed.json`
   - `git add -f src/data/generated-fallback.ts`
   - `git commit -m "chore: Release v2.x.x - ..."`

7. Git Tag erstellen
   - `git tag v2.x.x`

8. Push mit Tags
   - `git push`
   - `git push --tags`
```

**Beispiel:**
```bash
# 1. CHANGELOG aktualisieren
vim CHANGELOG.md

# 2. Version bumpen
vim package.json  # 2.4.3 → 2.4.4
vim public/manifest.webmanifest
vim src/config/site.ts

# 3. Production Build
bun run build

# 4. Alle Dateien inkl. generierte committen
git add -A
git add -f public/data/index.transformed.json
git add -f src/data/generated-fallback.ts
git commit -m "chore: Release v2.4.4 - Bug Fixes & Improvements"

# 5. Tag erstellen
git tag v2.4.4

# 6. Push mit Tags
git push && git push --tags
```

---

## 🔒 Regeln für generierte Dateien

### Diese Dateien sind in .gitignore:
- `public/data/index.transformed.json`
- `src/data/generated-fallback.ts`

### Warum?
- Ändern sich bei jedem Build (Timestamps)
- Verursachen unnötige Merge-Konflikte
- Können jederzeit neu generiert werden

### Wann committen?
**NUR bei Release-Commits!**

Verwende `git add -f <file>` um sie explizit hinzuzufügen:
```bash
git add -f public/data/index.transformed.json
git add -f src/data/generated-fallback.ts
```

---

## 🧪 Testing

### Lokal (vor jedem Push)
Pre-Push Hook führt automatisch aus:
- ESLint
- Vitest (49 Tests)
- Production Build

### GitHub CI/CD
Bei jedem Push läuft:
- ESLint
- Vitest
- Production Build
- Artifact Upload (7 Tage Retention)

**Wichtig:** Hooks können mit `--no-verify` übersprungen werden, aber das ist **nicht empfohlen**!

---

## 📝 Commit Message Format

Verwende [Conventional Commits](https://www.conventionalcommits.org/):

```
<typ>(<bereich>): <beschreibung>

[optionaler body]
```

### Typen:
- `feat`: Neues Feature
- `fix`: Bug Fix
- `docs`: Dokumentation
- `style`: Formatierung
- `refactor`: Code-Refactoring
- `perf`: Performance
- `test`: Tests
- `chore`: Build/Tools

### Beispiele:
```bash
feat(quiz): Add difficulty selector
fix(search): Handle special characters correctly
docs(readme): Update installation instructions
chore: Release v2.4.4 - Bug Fixes
```

---

## 🎯 Checkliste für Releases

- [ ] Alle Features/Fixes implementiert
- [ ] Tests erfolgreich (lokal + CI)
- [ ] CHANGELOG.md aktualisiert
- [ ] Version in 3 Dateien gebumpt
- [ ] Production Build erfolgreich
- [ ] Generierte Dateien geprüft
- [ ] Release-Commit erstellt
- [ ] Tag erstellt (v2.x.x)
- [ ] Gepusht (Commits + Tags)
- [ ] GitHub Actions erfolgreich
- [ ] Artifact erstellt

---

## 🚨 Wichtige Hinweise

### NIEMALS committen:
- ❌ `.env` Dateien (enthalten persönliche Daten)
- ❌ `node_modules/`
- ❌ `dist/` (Build-Output)
- ❌ Generierte Dateien (außer bei Releases!)

### IMMER prüfen vor Push:
- ✅ Linter-Errors behoben
- ✅ Tests erfolgreich
- ✅ Build läuft durch
- ✅ Keine `any` types
- ✅ Conventional Commit Message

### Bei Problemen:
1. Hooks überspringen mit `--no-verify` (nur Notfall!)
2. Fehler beheben
3. Erneut committen/pushen

---

## 🤖 Automatisierung

### Git Hooks (automatisch):
- **Pre-Commit:** ESLint
- **Pre-Push:** ESLint + Tests + Build
- **Prepare:** Hook-Installation bei `npm install`

### GitHub Actions (automatisch):
- **CI Pipeline:** Läuft bei jedem Push
- **Artifact:** Build wird 7 Tage gespeichert

---

*Last updated: 2026-01-01*
