import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Trophy, MapPin, Landmark, Grid3X3, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useKfzData } from '@/hooks/useKfzData';
import { searchKfzCode, SearchResult } from '@/lib/search';
import { getRandomBundeslaender, getBundeslandFromArs, getBundeslandFromShortName } from '@/data/bundeslaender';
import { recordQuizAnswer, recordCorrectedAnswer, getUserProgress, getUserSettings } from '@/lib/storage';
import type { UserSettings } from '@/data/schema';
import confetti from 'canvas-confetti';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuizQuestion {
  kfzCode: string;
  kreisName: string;
  correctAnswer: string;
  options: string[];
  result: SearchResult;
}

interface SessionStats {
  correct: number;
  wrong: number;
  wrongCodes: string[];
}

type QuizMode = 'normal' | 'errors';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'errors' ? 'errors' : 'normal';
  
  const { index, codeDetails, isLoading } = useKfzData();
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [askedCodes, setAskedCodes] = useState<Set<string>>(new Set());
  const [errorCodes, setErrorCodes] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, wrong: 0, wrongCodes: [] });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showModeSelect, setShowModeSelect] = useState(initialMode === 'normal');
  const [availableErrorCount, setAvailableErrorCount] = useState(0);

  const getCodeDetail = (code: string) => {
    if (!codeDetails?.codes) return null;
    return codeDetails.codes[code.toUpperCase()];
  };

  // Load error codes and settings
  useEffect(() => {
    const loadData = async () => {
      const [progress, userSettings] = await Promise.all([
        getUserProgress(),
        getUserSettings()
      ]);
      setErrorCodes(progress.quizErrors);
      setSettings(userSettings);
      setScore({ correct: progress.quizCorrect, total: progress.quizTotal });
    };
    loadData();
  }, []);

  // Keep availableErrorCount in sync with errorCodes
  useEffect(() => {
    setAvailableErrorCount(errorCodes.length);
  }, [errorCodes]);

  const generateQuestion = (forMode?: QuizMode) => {
    const currentMode = forMode ?? mode;
    if (!index) return;

    let availableCodes: string[];
    
    if (currentMode === 'errors') {
      // Only use error codes that haven't been asked yet in this session
      availableCodes = errorCodes.filter(code => !askedCodes.has(code));
      
      if (availableCodes.length === 0) {
        setQuestion(null);
        return;
      }
    } else {
      // Normal mode: all codes except already asked
      const allCodes = Object.keys(index.codeToIds);
      availableCodes = allCodes.filter(code => !askedCodes.has(code));
      
      if (availableCodes.length === 0) {
        setAskedCodes(new Set());
        availableCodes = Object.keys(index.codeToIds);
      }
    }

    // Try to find a valid question
    let attempts = 0;
    const maxAttempts = Math.min(20, availableCodes.length);
    const shuffledCodes = [...availableCodes].sort(() => Math.random() - 0.5);
    
    while (attempts < maxAttempts) {
      const code = shuffledCodes[attempts];
      attempts++;
      
      const results = searchKfzCode(code, index);
      
      if (results.length === 0) continue;

      const result = results[0];
      
      let bundesland = getBundeslandFromArs(result.ars);
      if (!bundesland) {
        bundesland = getBundeslandFromShortName(result.ars);
      }
      
      if (!bundesland) continue;

      const wrongOptions = getRandomBundeslaender(bundesland.code, 3).map(b => b.name);
      const allOptions = [...wrongOptions, bundesland.name].sort(() => Math.random() - 0.5);

      setAskedCodes(prev => new Set([...prev, code]));

      setQuestion({
        kfzCode: code,
        kreisName: result.name,
        correctAnswer: bundesland.name,
        options: allOptions,
        result,
      });
      setSelectedAnswer(null);
      setIsCorrect(null);
      return;
    }
    
    // Could not generate question
    setQuestion(null);
  };

  const startQuiz = (selectedMode: QuizMode) => {
    setMode(selectedMode);
    setShowModeSelect(false);
    setAskedCodes(new Set());
    setSessionStats({ correct: 0, wrong: 0, wrongCodes: [] });
    generateQuestion(selectedMode);
  };

  useEffect(() => {
    if (index && !showModeSelect) {
      generateQuestion();
    }
  }, [index]);

  // Auto-start error mode if coming from settings
  useEffect(() => {
    if (index && initialMode === 'errors' && errorCodes.length > 0) {
      startQuiz('errors');
    }
  }, [index, errorCodes]);

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer !== null || !question) return;

    setSelectedAnswer(answer);
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    // Update session stats
    setSessionStats(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      wrong: correct ? prev.wrong : prev.wrong + 1,
      wrongCodes: correct ? prev.wrongCodes : [...prev.wrongCodes, question.kfzCode],
    }));

    if (mode === 'errors') {
      if (correct) {
        // Corrected an error!
        await recordCorrectedAnswer(question.kfzCode);
        setErrorCodes(prev => prev.filter(c => c !== question.kfzCode));
      }
      // Wrong answers in error mode: code stays in error list, no stats change
    } else {
      // Normal mode
      await recordQuizAnswer(correct, question.kfzCode);
      if (!correct) {
        setErrorCodes(prev => prev.includes(question.kfzCode) ? prev : [...prev, question.kfzCode]);
      }
    }

    setScore(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));

    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#14b8a6', '#fbbf24', '#a855f7'],
      });
    }
  };

  const getPersonalizedMessage = (correct: boolean) => {
    const name = settings?.displayName;
    if (correct) {
      return name ? `Super, ${name}! Das ist richtig!` : 'Super! Das ist richtig!';
    }
    return `Das war ${question?.correctAnswer}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow text-5xl mb-4">🎯</div>
          <p className="text-muted-foreground">Quiz wird geladen...</p>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (showModeSelect) {
    return (
      <div className="min-h-screen bg-background">
        <header className="gradient-fun text-primary-foreground py-6 px-4 rounded-b-3xl shadow-lg">
          <div className="container max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="text-3xl">🎯</span>
                Quiz
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-display font-bold">Wähle einen Modus</h2>
            <p className="text-muted-foreground">
              {settings?.displayName ? `Hey ${settings.displayName}, was` : 'Was'} möchtest du üben?
            </p>
          </div>

          <div className="space-y-4">
            {/* Normal Mode */}
            <button
              onClick={() => startQuiz('normal')}
              className="w-full bg-card rounded-2xl p-6 shadow-card text-left hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎲</div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg">Alle Kennzeichen</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Zufällige Fragen aus allen deutschen Kfz-Kennzeichen
                  </p>
                </div>
              </div>
            </button>

            {/* Error Mode */}
            <button
              onClick={() => startQuiz('errors')}
              disabled={availableErrorCount === 0}
              className={`w-full bg-card rounded-2xl p-6 shadow-card text-left transition-shadow border-2 ${
                availableErrorCount > 0 
                  ? 'hover:shadow-lg hover:border-orange-500 border-transparent' 
                  : 'opacity-50 cursor-not-allowed border-transparent'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔄</div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    Fehler wiederholen
                    {availableErrorCount > 0 && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {availableErrorCount}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {availableErrorCount > 0 
                      ? `${availableErrorCount} falsche Antworten nochmal üben`
                      : 'Noch keine Fehler zum Wiederholen'
                    }
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Current Stats */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gesamt richtig</span>
              <span className="font-bold text-success">{score.correct}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Gesamt falsch</span>
              <span className="font-bold text-destructive">{score.total - score.correct}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error mode completed
  if (mode === 'errors' && !question && askedCodes.size > 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="gradient-fun text-primary-foreground py-6 px-4 rounded-b-3xl shadow-lg">
          <div className="container max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-2xl font-display font-bold">🎯 Quiz</h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="bg-card rounded-3xl p-8 shadow-card text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-display font-bold">
              {settings?.displayName ? `Gut gemacht, ${settings.displayName}!` : 'Gut gemacht!'}
            </h2>
            <p className="text-muted-foreground">
              Du hast alle Fehler durchgearbeitet!
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-success/20 rounded-xl p-4">
                <p className="text-3xl font-bold text-success">{sessionStats.correct}</p>
                <p className="text-sm text-muted-foreground">Korrigiert</p>
              </div>
              <div className="bg-destructive/20 rounded-xl p-4">
                <p className="text-3xl font-bold text-destructive">{sessionStats.wrong}</p>
                <p className="text-sm text-muted-foreground">Noch zu üben</p>
              </div>
            </div>

            {sessionStats.wrong > 0 && (
              <div className="bg-orange-500/10 rounded-xl p-4 text-left">
                <p className="text-sm font-medium text-orange-600 mb-2">
                  Diese {sessionStats.wrong} Kürzel solltest du nochmal üben:
                </p>
                <p className="text-sm text-muted-foreground">
                  {sessionStats.wrongCodes.join(', ')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sessionStats.wrong > 0 && (
              <Button
                onClick={() => {
                  // Reset state and update availableErrorCount with remaining errors
                  const remainingErrors = sessionStats.wrongCodes;
                  setAskedCodes(new Set());
                  setAvailableErrorCount(remainingErrors.length);
                  setSessionStats({ correct: 0, wrong: 0, wrongCodes: [] });
                  // Generate question with fresh askedCodes (pass empty set directly)
                  if (!index) return;
                  const availableCodes = errorCodes.filter(code => remainingErrors.includes(code));
                  if (availableCodes.length === 0) return;
                  
                  const code = availableCodes[Math.floor(Math.random() * availableCodes.length)];
                  const results = searchKfzCode(code, index);
                  if (results.length === 0) return;
                  
                  const result = results[0];
                  let bundesland = getBundeslandFromArs(result.ars) || getBundeslandFromShortName(result.ars);
                  if (!bundesland) return;
                  
                  const wrongOptions = getRandomBundeslaender(bundesland.code, 3).map(b => b.name);
                  const allOptions = [...wrongOptions, bundesland.name].sort(() => Math.random() - 0.5);
                  
                  setAskedCodes(new Set([code]));
                  setQuestion({
                    kfzCode: code,
                    kreisName: result.name,
                    correctAnswer: bundesland.name,
                    options: allOptions,
                    result,
                  });
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}
                className="w-full gradient-fun text-primary-foreground py-6 text-lg font-display font-bold rounded-2xl"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Fehler nochmal üben
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowModeSelect(true)}
              className="w-full py-6 text-lg font-display rounded-2xl"
            >
              Zurück zur Auswahl
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-fun text-primary-foreground py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setShowModeSelect(true)}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="text-3xl">{mode === 'errors' ? '🔄' : '🎯'}</span>
                {mode === 'errors' ? 'Fehler-Quiz' : 'Quiz'}
              </h1>
              {mode === 'errors' && (
                <p className="text-xs text-primary-foreground/80 mt-1">
                  {availableErrorCount - sessionStats.correct - sessionStats.wrong + (question && selectedAnswer === null ? 1 : 0)} verbleibend
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">
                {mode === 'errors' 
                  ? `${sessionStats.correct}/${sessionStats.correct + sessionStats.wrong}`
                  : `${score.correct}/${score.total}`
                }
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Session Stats Bar */}
      {sessionStats.wrong > 0 && (
        <div className="container max-w-lg mx-auto px-4 pt-4">
          <div className="bg-orange-500/10 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {sessionStats.wrong} Fehler in dieser Runde
            </span>
            <span className="text-xs text-muted-foreground">
              {sessionStats.wrongCodes.slice(-3).join(', ')}
            </span>
          </div>
        </div>
      )}

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {question && (
          <>
            {/* Question Card */}
            <div className="bg-card rounded-3xl p-6 shadow-card text-center space-y-4">
              <p className="text-muted-foreground">Zu welchem Bundesland gehört...</p>
              <div className="py-4">
                <span className="text-5xl font-display font-bold gradient-primary bg-clip-text text-transparent">
                  {question.kfzCode}
                </span>
              </div>
              <p className="text-lg font-medium">{question.kreisName}</p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option) => {
                let buttonClass = "w-full py-5 text-lg font-display font-semibold rounded-2xl border-2 transition-all ";
                
                if (selectedAnswer === null) {
                  buttonClass += "border-border hover:border-primary hover:bg-primary/10";
                } else if (option === question.correctAnswer) {
                  buttonClass += "border-success bg-success/20 text-success";
                } else if (option === selectedAnswer) {
                  buttonClass += "border-destructive bg-destructive/20 text-destructive";
                } else {
                  buttonClass += "border-border opacity-50";
                }

                return (
                  <Button
                    key={option}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="flex items-center gap-2">
                      {selectedAnswer !== null && option === question.correctAnswer && (
                        <Check className="w-5 h-5" />
                      )}
                      {selectedAnswer === option && option !== question.correctAnswer && (
                        <X className="w-5 h-5" />
                      )}
                      {option}
                    </span>
                  </Button>
                );
              })}
            </div>

            {/* Result & Details */}
            {selectedAnswer !== null && (
              <div className="space-y-4 animate-fade-in">
                {/* Result Message */}
                <div className={`text-center py-4 rounded-2xl ${isCorrect ? 'bg-success/20' : 'bg-destructive/20'}`}>
                  <p className="text-2xl mb-2">{isCorrect ? '🎉' : '😅'}</p>
                  <p className="font-display font-bold text-lg">
                    {getPersonalizedMessage(isCorrect!)}
                  </p>
                  {mode === 'errors' && isCorrect && (
                    <p className="text-sm text-success mt-1">✓ Als korrigiert markiert</p>
                  )}
                </div>

                {/* Details Card */}
                <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {question.result.name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Bundesland */}
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Landmark className="w-3 h-3" />
                        Bundesland
                      </p>
                      <p className="font-semibold">{question.result.bundesland}</p>
                      <p className="text-sm text-muted-foreground">{question.result.bundeslandShort}</p>
                    </div>
                    
                    {/* All KFZ Codes */}
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Grid3X3 className="w-3 h-3" />
                        Alle Kürzel
                      </p>
                      <TooltipProvider delayDuration={300}>
                        <div className="flex flex-wrap gap-1">
                          {question.result.kfzCodes.map(code => {
                            const detail = getCodeDetail(code);
                            return (
                              <Tooltip key={code}>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-sm font-medium cursor-help ${
                                      code === question.kfzCode
                                        ? 'bg-primary text-primary-foreground'
                                        : detail?.type === 'historic'
                                        ? 'bg-secondary/20 text-secondary border border-secondary/30'
                                        : 'bg-background border border-border'
                                    }`}
                                  >
                                    {code}
                                  </span>
                                </TooltipTrigger>
                                {detail && (
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="font-semibold">{code} = {detail.origin}</p>
                                    {detail.note && (
                                      <p className="text-xs text-muted-foreground mt-1">{detail.note}</p>
                                    )}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  className="w-full gradient-primary text-primary-foreground py-6 text-lg font-display font-bold rounded-2xl"
                  onClick={() => generateQuestion()}
                >
                  {mode === 'errors' && errorCodes.filter(c => !askedCodes.has(c)).length === 0
                    ? 'Zur Übersicht 📊'
                    : 'Nächste Frage 🚀'
                  }
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Quiz;
