import { useState, useEffect } from 'react';
import { ArrowLeft, User, Moon, Sun, Monitor, RotateCcw, Trash2, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="w-6 h-6" />
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

        {/* Quiz Stats */}
        {progress && (
          <section className="bg-card rounded-2xl p-6 shadow-card space-y-4">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Quiz-Statistiken
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-success">{progress.quizCorrect}</p>
                <p className="text-xs text-muted-foreground">Richtig</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-destructive">{progress.quizTotal - progress.quizCorrect}</p>
                <p className="text-xs text-muted-foreground">Falsch</p>
              </div>
            </div>
            {progress.quizErrors.length > 0 && (
              <div className="bg-destructive/10 rounded-xl p-3">
                <p className="text-sm font-medium text-destructive">
                  {progress.quizErrors.length} Fehler zum Wiederholen
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.quizErrors.slice(0, 5).join(', ')}
                  {progress.quizErrors.length > 5 && ` +${progress.quizErrors.length - 5} weitere`}
                </p>
              </div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl">
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
          <p className="text-sm text-muted-foreground">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
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
