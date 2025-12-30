import { useState, useEffect } from 'react';
import { ArrowLeft, User, Moon, Sun, Monitor, RotateCcw, Trash2, Trophy, AlertTriangle, RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import {
  getUserSettings,
  updateUserSettings,
  getUserProgress,
  resetQuizProgress,
  resetAllData
} from '@/lib/storage';
import type { UserSettings, UserProgress } from '@/data/schema';
import { useToast } from '@/hooks/use-toast';
import { useUpdate } from '@/contexts/UpdateContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [displayName, setDisplayName] = useState('');
  const { toast } = useToast();
  const {
    dataVersion,
    newVersion,
    updateAvailable,
    checking,
    checkForUpdates,
    installUpdate,
  } = useUpdate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, p] = await Promise.all([getUserSettings(), getUserProgress()]);
    setSettings(s);
    setProgress(p);
    setDisplayName(s.displayName);
  };

  const handleNameChange = async (name: string) => {
    setDisplayName(name);
    await updateUserSettings({ displayName: name });
    toast({
      title: 'Gespeichert!',
      description: name ? `Hallo, ${name}!` : 'Name entfernt',
    });
  };

  const handleDarkModeChange = async (mode: 'system' | 'light' | 'dark') => {
    await updateUserSettings({ darkMode: mode });
    setSettings(prev => prev ? { ...prev, darkMode: mode } : null);
    
    // Apply theme
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    toast({
      title: 'Design geändert',
      description: mode === 'system' ? 'Folgt dem System' : mode === 'dark' ? 'Dunkelmodus aktiviert' : 'Hellmodus aktiviert',
    });
  };

  const handleOfflineModeChange = async (enabled: boolean) => {
    await updateUserSettings({ offlineMode: enabled });
    setSettings(prev => prev ? { ...prev, offlineMode: enabled } : null);

    toast({
      title: enabled ? "Offline-Modus aktiviert" : "Offline-Modus deaktiviert",
      description: enabled
        ? "Die App verwendet jetzt nur noch lokale Daten und macht keine Netzwerk-Anfragen."
        : "Die App aktualisiert Daten wieder automatisch wenn online.",
    });
  };

  const handleResetQuiz = async () => {
    await resetQuizProgress();
    await loadData();
    toast({
      title: 'Quiz zurückgesetzt',
      description: 'Alle Quiz-Statistiken wurden gelöscht.',
    });
  };

  const handleResetAll = async () => {
    await resetAllData();
    await loadData();
    setDisplayName('');
    toast({
      title: 'Alles zurückgesetzt',
      description: 'Alle Daten wurden gelöscht.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" aria-label="Zurück zur Startseite">
                <ArrowLeft className="w-6 h-6" aria-hidden="true" />
              </Button>
            </Link>
            <h1 className="text-2xl font-display font-bold">⚙️ Einstellungen</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Display Name */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Anzeigename
          </h2>
          <p className="text-sm text-muted-foreground">
            Für persönliche Begrüßungen im Quiz
          </p>
          <div className="space-y-2">
            <Label htmlFor="displayName">Dein Name</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="z.B. Max"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={(e) => handleNameChange(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </section>

        {/* Dark Mode */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Erscheinungsbild
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={settings?.darkMode === 'light' ? 'default' : 'outline'}
              className="flex-col gap-2 h-auto py-4 rounded-xl"
              onClick={() => handleDarkModeChange('light')}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Hell</span>
            </Button>
            <Button
              variant={settings?.darkMode === 'dark' ? 'default' : 'outline'}
              className="flex-col gap-2 h-auto py-4 rounded-xl"
              onClick={() => handleDarkModeChange('dark')}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dunkel</span>
            </Button>
            <Button
              variant={settings?.darkMode === 'system' ? 'default' : 'outline'}
              className="flex-col gap-2 h-auto py-4 rounded-xl"
              onClick={() => handleDarkModeChange('system')}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs">System</span>
            </Button>
          </div>
        </section>

        {/* Offline Mode */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-primary" />
            Offline-Modus
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <Label htmlFor="offline-mode" className="text-base font-medium cursor-pointer">
                Nur Offline verwenden
              </Label>
              <p className="text-sm text-muted-foreground">
                Deaktiviert alle Netzwerk-Anfragen. Die App verwendet nur lokale Daten.
              </p>
            </div>
            <Switch
              id="offline-mode"
              checked={settings?.offlineMode || false}
              onCheckedChange={handleOfflineModeChange}
            />
          </div>
        </section>

        {/* App Updates */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            App-Updates
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Datenversion:</span>
              <span className="font-mono text-xs">{dataVersion || 'Lädt...'}</span>
            </div>
            {newVersion && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verfügbar:</span>
                <span className="font-mono text-xs text-primary font-bold">{newVersion}</span>
              </div>
            )}
          </div>
          <Button
            onClick={updateAvailable ? installUpdate : checkForUpdates}
            disabled={checking || !navigator.onLine}
            className="w-full rounded-xl"
            variant={updateAvailable ? "default" : "outline"}
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Suche nach Updates...
              </>
            ) : updateAvailable ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update installieren
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Nach Updates suchen
              </>
            )}
          </Button>
          {!navigator.onLine && (
            <p className="text-xs text-muted-foreground text-center">
              Keine Internetverbindung
            </p>
          )}
        </section>

        {/* Quiz Stats */}
        {progress && (
          <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Quiz-Statistiken
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-success">{progress.quizCorrect}</p>
                <p className="text-xs text-muted-foreground">Richtig</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{progress.quizTotal - progress.quizCorrect}</p>
                <p className="text-xs text-muted-foreground">Falsch</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{progress.quizCorrected?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Korrigiert</p>
              </div>
            </div>
            {progress.quizErrors.length > 0 && (
              <Link to="/quiz?mode=errors" className="block">
                <div className="bg-orange-500/10 rounded-xl p-3 hover:bg-orange-500/20 transition-colors cursor-pointer border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">
                        {progress.quizErrors.length} Fehler zum Wiederholen
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress.quizErrors.slice(0, 5).join(', ')}
                        {progress.quizErrors.length > 5 && ` +${progress.quizErrors.length - 5} weitere`}
                      </p>
                    </div>
                    <span className="text-orange-500">→</span>
                  </div>
                </div>
              </Link>
            )}
            <div className="bg-orange-500/10 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-orange-600">
                Folgende Daten werden beim Reset gelöscht:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Quiz-Statistiken (Punkte, richtige/falsche Antworten)</li>
                <li>Fehler-Liste zum Wiederholen</li>
                <li>Verdiente Badges und Erfolge</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Deine Suchhistorie und Einstellungen bleiben erhalten.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Quiz zurücksetzen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Quiz zurücksetzen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle Quiz-Statistiken (Punkte, Fehler) werden gelöscht. 
                    Deine Badges und Suchhistorie bleiben erhalten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetQuiz}>
                    Zurücksetzen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        )}

        {/* Danger Zone */}
        <section className="bg-card rounded-2xl p-6 shadow-card space-y-4 border-2 border-destructive/20">
          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Gefahrenzone
          </h2>
          <div className="bg-destructive/5 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">
              Folgende Daten werden unwiderruflich gelöscht:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Quiz-Statistiken (Punkte, richtige/falsche Antworten)</li>
              <li>Fehler-Liste zum Wiederholen</li>
              <li>Verdiente Badges und Erfolge</li>
              <li>Suchhistorie und Streak-Fortschritt</li>
              <li>Anzeigename und alle Einstellungen</li>
            </ul>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full rounded-xl">
                <Trash2 className="w-4 h-4 mr-2" />
                Alle Daten löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wirklich alles löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alle deine Daten werden unwiderruflich gelöscht:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Quiz-Statistiken und Fehler</li>
                    <li>Verdiente Badges</li>
                    <li>Suchhistorie und Streak</li>
                    <li>Einstellungen und Name</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetAll} className="bg-destructive hover:bg-destructive/90">
                  Alles löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
};

export default Settings;
