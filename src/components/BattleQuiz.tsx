import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Users, Clock, Hash, Trophy, Crown, Play, RotateCcw, Check, X, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useKfzData } from '@/hooks/useKfzData';
import { searchKfzCode, SearchResult } from '@/lib/search';
import { getRandomBundeslaender, getBundeslandFromArs, getBundeslandFromShortName } from '@/data/bundeslaender';
import { useSettings } from '@/contexts/SettingsContext';

interface BattleQuestion {
  kfzCode: string;
  kreisName: string;
  correctAnswer: string;
  options: string[];
  result: SearchResult;
}

interface AnswerRecord {
  question: BattleQuestion;
  givenAnswer: string;
  isCorrect: boolean;
}

interface PlayerScore {
  name: string;
  correct: number;
  wrong: number;
  time: number; // in milliseconds
  questions?: BattleQuestion[]; // For solo mode - each player gets own questions
  answers: AnswerRecord[]; // History of all answers
}

type BattleMode = 'time' | 'count';
type BattleType = 'versus' | 'solo' | 'challenge'; // versus = same questions, solo = random questions each, challenge = single player
type BattlePhase = 'setup' | 'playing' | 'handover' | 'results';

interface BattleQuizProps {
  onBack: () => void;
}

const TIME_OPTIONS = [15, 30, 45, 60];
const COUNT_OPTIONS = [10, 20, 30, 50];

const BattleQuiz = ({ onBack }: BattleQuizProps) => {
  const { index, isLoading } = useKfzData();
  const { settings } = useSettings();

  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['']);
  const [battleMode, setBattleMode] = useState<BattleMode>('time');
  const [battleType, setBattleType] = useState<BattleType>('challenge');
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionCount, setQuestionCount] = useState(20);

  // Sync player name with settings
  useEffect(() => {
    if (settings?.displayName) {
      // Pre-fill if player name is empty
      setPlayerNames(prev => prev[0] === '' ? [settings.displayName] : prev);
    }
  }, [settings]);
  
  // Game state
  const [phase, setPhase] = useState<BattlePhase>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playerStartTime, setPlayerStartTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate all questions upfront for fairness
  const generateQuestions = useCallback((count: number): BattleQuestion[] => {
    if (!index) return [];
    
    const allCodes = Object.keys(index.codeToIds);
    const shuffledCodes = [...allCodes].sort(() => Math.random() - 0.5);
    const generatedQuestions: BattleQuestion[] = [];
    
    for (const code of shuffledCodes) {
      if (generatedQuestions.length >= count) break;
      
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
      
      generatedQuestions.push({
        kfzCode: code,
        kreisName: result.name,
        correctAnswer: bundesland.name,
        options: allOptions,
        result,
      });
    }
    
    return generatedQuestions;
  }, [index]);

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (idx: number) => {
    const minPlayers = battleType === 'challenge' ? 1 : 2;
    if (playerNames.length > minPlayers) {
      setPlayerNames(playerNames.filter((_, i) => i !== idx));
    }
  };

  const updatePlayerName = (idx: number, name: string) => {
    const newNames = [...playerNames];
    newNames[idx] = name;
    setPlayerNames(newNames);
  };

  const canStart = battleType === 'challenge' 
    ? (playerNames[0].trim().length > 0 || defaultPlayerName.length > 0)
    : playerNames.every(name => name.trim().length > 0);

  const startBattle = () => {
    const maxQuestions = battleMode === 'count' ? questionCount : 100; // Generate enough for time mode
    
    if (battleType === 'challenge') {
      // Challenge mode: single player - use default name if empty
      const generatedQuestions = generateQuestions(maxQuestions);
      
      if (generatedQuestions.length < (battleMode === 'count' ? questionCount : 10)) {
        return;
      }
      
      const playerName = playerNames[0].trim() || defaultPlayerName || 'Spieler';
      setQuestions(generatedQuestions);
      setPlayerScores([{ name: playerName, correct: 0, wrong: 0, time: 0, answers: [] }]);
    } else if (battleType === 'solo') {
      // Solo mode: each player gets their own random questions
      const playersWithQuestions = playerNames.map(name => {
        const playerQuestions = generateQuestions(maxQuestions);
        return { 
          name: name.trim(), 
          correct: 0, 
          wrong: 0, 
          time: 0,
          questions: playerQuestions,
          answers: []
        };
      });
      
      if (playersWithQuestions.some(p => (p.questions?.length || 0) < (battleMode === 'count' ? questionCount : 10))) {
        return; // Not enough questions
      }
      
      setPlayerScores(playersWithQuestions);
      setQuestions(playersWithQuestions[0].questions || []);
    } else {
      // Versus mode: same questions for all players
      const generatedQuestions = generateQuestions(maxQuestions);
      
      if (generatedQuestions.length < (battleMode === 'count' ? questionCount : 10)) {
        return; // Not enough questions
      }
      
      setQuestions(generatedQuestions);
      setPlayerScores(playerNames.map(name => ({ name: name.trim(), correct: 0, wrong: 0, time: 0, answers: [] })));
    }
    
    setCurrentPlayerIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase('playing');
    
    if (battleMode === 'time') {
      setTimeRemaining(timeLimit);
      setPlayerStartTime(Date.now());
    } else {
      setPlayerStartTime(Date.now());
    }
  };

  // Timer effect for time mode
  useEffect(() => {
    if (phase === 'playing' && battleMode === 'time' && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (phase === 'playing' && battleMode === 'time' && timeRemaining === 0) {
      // Time's up for current player
      finishCurrentPlayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleMode, timeRemaining]);

  const finishCurrentPlayer = useCallback(() => {
    const elapsed = Date.now() - playerStartTime;

    setPlayerScores(prev => {
      const newScores = [...prev];
      newScores[currentPlayerIndex].time = elapsed;
      return newScores;
    });

    if (currentPlayerIndex < playerNames.length - 1) {
      // Show handover screen for multiplayer modes
      if (battleType !== 'challenge') {
        setPhase('handover');
      } else {
        // Single player - shouldn't happen but fallback
        setPhase('results');
      }
    } else {
      // All players done
      setPhase('results');
    }
  }, [playerStartTime, currentPlayerIndex, playerNames.length, battleType]);

  const startNextPlayer = () => {
    const nextPlayerIndex = currentPlayerIndex + 1;
    setCurrentPlayerIndex(nextPlayerIndex);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    // In solo mode, switch to next player's questions
    if (battleType === 'solo') {
      const nextPlayerQuestions = playerScores[nextPlayerIndex].questions || [];
      setQuestions(nextPlayerQuestions);
    }
    
    if (battleMode === 'time') {
      setTimeRemaining(timeLimit);
    }
    setPlayerStartTime(Date.now());
    setPhase('playing');
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    const question = questions[currentQuestionIndex];
    const correct = answer === question.correctAnswer;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    
    setPlayerScores(prev => {
      const newScores = [...prev];
      if (correct) {
        newScores[currentPlayerIndex].correct += 1;
      } else {
        newScores[currentPlayerIndex].wrong += 1;
      }
      // Record the answer
      newScores[currentPlayerIndex].answers.push({
        question,
        givenAnswer: answer,
        isCorrect: correct
      });
      return newScores;
    });
    
    // Auto-advance after short delay
    setTimeout(() => {
      // Remove focus from button to prevent focus state on next question
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      if (battleMode === 'count') {
        if (currentQuestionIndex + 1 >= questionCount) {
          finishCurrentPlayer();
        } else {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsCorrect(null);
        }
      } else {
        // Time mode - just go to next question
        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsCorrect(null);
        }
      }
    }, 800);
  };

  const resetBattle = () => {
    setPhase('setup');
    setCurrentPlayerIndex(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPlayerScores([]);
    setQuestions([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const getWinner = (): PlayerScore | null => {
    if (playerScores.length === 0) return null;
    
    if (battleMode === 'time') {
      // Most correct answers wins
      return [...playerScores].sort((a, b) => b.correct - a.correct)[0];
    } else {
      // Count mode: most correct wins, if tie then fastest time
      return [...playerScores].sort((a, b) => {
        if (b.correct !== a.correct) return b.correct - a.correct;
        return a.time - b.time;
      })[0];
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow text-5xl mb-4">⚔️</div>
          <p className="text-muted-foreground">Battle wird vorbereitet...</p>
        </div>
      </div>
    );
  }

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-4 rounded-b-3xl shadow-lg">
          <div className="container max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onBack}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <span className="text-3xl">⚔️</span>
                Battle-Modus
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Battle Type Selection */}
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display font-bold">Spielmodus</h2>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setBattleType('challenge');
                  if (playerNames.length > 1) setPlayerNames([playerNames[0]]);
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  battleType === 'challenge' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-border hover:border-green-300'
                }`}
              >
                <User className={`w-6 h-6 mx-auto mb-1 ${battleType === 'challenge' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <p className="font-bold text-xs">Challenge</p>
                <p className="text-[10px] text-muted-foreground">1 Spieler</p>
              </button>
              
              <button
                onClick={() => {
                  setBattleType('versus');
                  if (playerNames.length < 2) setPlayerNames([...playerNames, '']);
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  battleType === 'versus' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-border hover:border-blue-300'
                }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-1 ${battleType === 'versus' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <p className="font-bold text-xs">Versus</p>
                <p className="text-[10px] text-muted-foreground">Gleiche Fragen</p>
              </button>
              
              <button
                onClick={() => {
                  setBattleType('solo');
                  if (playerNames.length < 2) setPlayerNames([...playerNames, '']);
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  battleType === 'solo' 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-border hover:border-orange-300'
                }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-1 ${battleType === 'solo' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <p className="font-bold text-xs">Random</p>
                <p className="text-[10px] text-muted-foreground">Zufällige Fragen</p>
              </button>
            </div>
          </div>

          {/* Player Names */}
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              {battleType === 'challenge' ? 'Spieler' : `Spieler (${playerNames.length})`}
            </h2>
            
            <div className="space-y-3">
              {playerNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <Input
                    id={`player-name-${idx}`}
                    name={`player-name-${idx}`}
                    placeholder={battleType === 'challenge' ? 'Dein Name' : `Spieler ${idx + 1}`}
                    value={name}
                    onChange={(e) => updatePlayerName(idx, e.target.value)}
                    className="flex-1"
                  />
                  {playerNames.length > (battleType === 'challenge' ? 1 : 2) && (
                    <Button variant="ghost" size="icon" onClick={() => removePlayer(idx)} className="text-destructive">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {battleType !== 'challenge' && playerNames.length < 4 && (
              <Button variant="outline" onClick={addPlayer} className="w-full">
                <User className="w-4 h-4 mr-2" />
                Spieler hinzufügen
              </Button>
            )}
          </div>

          {/* Battle Mode */}
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display font-bold">Battle-Typ</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBattleMode('time')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  battleMode === 'time' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-border hover:border-purple-300'
                }`}
              >
                <Clock className={`w-8 h-8 mx-auto mb-2 ${battleMode === 'time' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                <p className="font-bold text-sm">Zeit-Battle</p>
                <p className="text-xs text-muted-foreground">Wer schafft mehr?</p>
              </button>
              
              <button
                onClick={() => setBattleMode('count')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  battleMode === 'count' 
                    ? 'border-pink-500 bg-pink-500/10' 
                    : 'border-border hover:border-pink-300'
                }`}
              >
                <Hash className={`w-8 h-8 mx-auto mb-2 ${battleMode === 'count' ? 'text-pink-500' : 'text-muted-foreground'}`} />
                <p className="font-bold text-sm">Fragen-Battle</p>
                <p className="text-xs text-muted-foreground">Wer ist schneller?</p>
              </button>
            </div>
          </div>

          {/* Settings based on mode */}
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-display font-bold">
              {battleMode === 'time' ? 'Zeit wählen' : 'Anzahl Fragen'}
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {battleMode === 'time' ? (
                TIME_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`px-4 py-2 rounded-full font-bold transition-all ${
                      timeLimit === t
                        ? 'bg-purple-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {t} Sek
                  </button>
                ))
              ) : (
                COUNT_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setQuestionCount(c)}
                    className={`px-4 py-2 rounded-full font-bold transition-all ${
                      questionCount === c
                        ? 'bg-pink-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {c} Fragen
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={startBattle}
            disabled={!canStart}
            className="w-full py-6 text-lg font-display font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Play className="w-5 h-5 mr-2" />
            Battle starten!
          </Button>
        </main>
      </div>
    );
  }

  // Playing Phase
  if (phase === 'playing') {
    const question = questions[currentQuestionIndex];
    const currentPlayer = playerScores[currentPlayerIndex];
    
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-4 rounded-b-3xl shadow-lg">
          <div className="container max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {currentPlayerIndex + 1}
                </div>
                <span className="font-bold">{currentPlayer.name}</span>
              </div>
              
              {battleMode === 'time' ? (
                <div className={`text-2xl font-mono font-bold ${timeRemaining <= 5 ? 'text-yellow-300 animate-pulse' : ''}`}>
                  {timeRemaining}s
                </div>
              ) : (
                <div className="text-sm">
                  {currentQuestionIndex + 1} / {questionCount}
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{currentPlayer.correct}</span>
              </div>
            </div>
            
            {/* Player progress indicators */}
            <div className="flex gap-1">
              {playerNames.map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    idx < currentPlayerIndex 
                      ? 'bg-white' 
                      : idx === currentPlayerIndex 
                        ? 'bg-white/60' 
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Question */}
          <div className="bg-card rounded-3xl p-8 shadow-card text-center">
            <p className="text-muted-foreground text-sm mb-4">In welchem Bundesland liegt...</p>
            <div className="text-6xl font-display font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {question.kfzCode}
            </div>
            <p className="text-muted-foreground">{question.kreisName}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === question.correctAnswer;
              const showResult = selectedAnswer !== null;
              
              let buttonClass = 'bg-card hover:bg-muted border-2 border-border';
              if (showResult) {
                if (isCorrectAnswer) {
                  buttonClass = 'bg-success/20 border-2 border-success';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'bg-destructive/20 border-2 border-destructive';
                }
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={`p-4 rounded-2xl font-medium transition-all flex items-center justify-between ${buttonClass}`}
                >
                  <span>{option}</span>
                  {showResult && isCorrectAnswer && <Check className="w-5 h-5 text-success" />}
                  {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-destructive" />}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Handover Phase - transition between players
  if (phase === 'handover') {
    const nextPlayerIndex = currentPlayerIndex + 1;
    const nextPlayer = playerNames[nextPlayerIndex];
    const currentPlayer = playerScores[currentPlayerIndex];
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center space-y-8">
          {/* Current player done */}
          <div className="bg-card rounded-3xl p-8 shadow-card space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold">
              {currentPlayer.name} ist fertig!
            </h2>
            <p className="text-muted-foreground">
              Ergebnis wird am Ende angezeigt
            </p>
          </div>

          {/* Next player */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 shadow-lg text-white space-y-6">
            <div className="space-y-2">
              <p className="text-white/80 text-sm">Nächster Spieler</p>
              <h1 className="text-3xl font-display font-bold">{nextPlayer}</h1>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="bg-white/20 rounded-full px-4 py-2">
                {battleMode === 'time' ? `${timeLimit} Sekunden` : `${questionCount} Fragen`}
              </div>
              <div className="bg-white/20 rounded-full px-4 py-2">
                Spieler {nextPlayerIndex + 1} von {playerNames.length}
              </div>
            </div>

            <p className="text-white/60 text-sm">
              Gib das Gerät an {nextPlayer} weiter
            </p>

            <Button
              onClick={startNextPlayer}
              className="w-full py-6 text-lg font-display font-bold rounded-2xl bg-white text-purple-600 hover:bg-white/90"
            >
              <Play className="w-5 h-5 mr-2" />
              {nextPlayer} startet!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  const winner = getWinner();
  const sortedScores = [...playerScores].sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.time - b.time;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="container max-w-lg mx-auto text-center">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-2xl font-display font-bold">Battle beendet!</h1>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Winner Card */}
        {winner && (
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 text-center text-white shadow-lg">
            <Crown className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-2xl font-display font-bold mb-1">{winner.name}</h2>
            <p className="text-white/80">
              {winner.correct} richtige Antworten
              {battleMode === 'count' && ` in ${formatTime(winner.time)}`}
            </p>
          </div>
        )}

        {/* All Scores */}
        <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="font-display font-bold">Ergebnisse</h2>
          
          <div className="space-y-3">
            {sortedScores.map((player, idx) => (
              <Collapsible key={idx}>
                <div
                  className={`rounded-xl ${
                    idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted'
                  }`}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-white' : 'bg-muted-foreground/20'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {battleMode === 'count' ? formatTime(player.time) : `${player.correct + player.wrong} beantwortet`}
                        </p>
                      </div>
                      <div className="text-right mr-2">
                        <p className="font-bold text-success">{player.correct} ✓</p>
                        <p className="text-xs text-destructive">{player.wrong} ✗</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 border-t border-border/50">
                      <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                        {player.answers.map((answer, answerIdx) => (
                          <div 
                            key={answerIdx}
                            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                              answer.isCorrect ? 'bg-success/10' : 'bg-destructive/10'
                            }`}
                          >
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              answer.isCorrect ? 'bg-success text-white' : 'bg-destructive text-white'
                            }`}>
                              {answer.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </span>
                            <span className="font-mono font-bold">{answer.question.kfzCode}</span>
                            <span className="flex-1 truncate text-muted-foreground">
                              {answer.question.kreisName}
                            </span>
                            {!answer.isCorrect && (
                              <span className="text-xs text-destructive">
                                ({answer.givenAnswer})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={startBattle}
            className="w-full py-6 text-lg font-display font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Nochmal spielen
          </Button>
          <Button
            variant="outline"
            onClick={resetBattle}
            className="w-full py-6 text-lg font-display rounded-2xl"
          >
            Neues Battle
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            Zurück zur Auswahl
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BattleQuiz;
