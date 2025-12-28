import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Trophy, MapPin, Landmark, Grid3X3, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useKfzData } from '@/hooks/useKfzData';
import { getRandomKfzCode, searchKfzCode, SearchResult } from '@/lib/search';
import { getRandomBundeslaender, getBundeslandFromArs, getBundeslandFromShortName } from '@/data/bundeslaender';
import { recordQuizAnswer, getUserProgress } from '@/lib/storage';
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
  result: SearchResult; // Store the full search result for displaying details
}

const Quiz = () => {
  const { index, codeDetails, isLoading } = useKfzData();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [askedCodes, setAskedCodes] = useState<Set<string>>(new Set());

  const getCodeDetail = (code: string) => {
    if (!codeDetails?.codes) return null;
    return codeDetails.codes[code.toUpperCase()];
  };

  const generateQuestion = () => {
    if (!index) return;

    // Get all available codes and filter out already asked ones
    const allCodes = Object.keys(index.codeToIds);
    const availableCodes = allCodes.filter(code => !askedCodes.has(code));
    
    // If all codes have been asked, reset the session
    if (availableCodes.length === 0) {
      setAskedCodes(new Set());
      return generateQuestion();
    }

    // Try a few times to find a valid question
    let attempts = 0;
    const maxAttempts = Math.min(20, availableCodes.length);
    const shuffledCodes = [...availableCodes].sort(() => Math.random() - 0.5);
    
    while (attempts < maxAttempts) {
      const code = shuffledCodes[attempts];
      attempts++;
      
      const results = searchKfzCode(code, index);
      
      if (results.length === 0) continue;

      const result = results[0];
      
      // Try to get Bundesland from ARS first, then from short name
      let bundesland = getBundeslandFromArs(result.ars);
      if (!bundesland) {
        bundesland = getBundeslandFromShortName(result.ars);
      }
      
      if (!bundesland) continue;

      const wrongOptions = getRandomBundeslaender(bundesland.code, 3).map(b => b.name);
      const allOptions = [...wrongOptions, bundesland.name].sort(() => Math.random() - 0.5);

      // Mark this code as asked
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
    
    console.warn('Could not generate quiz question after', maxAttempts, 'attempts');
  };

  useEffect(() => {
    if (index) {
      generateQuestion();
      getUserProgress().then(p => {
        setScore({ correct: p.quizCorrect, total: p.quizTotal });
      });
    }
  }, [index]);

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer !== null || !question) return;

    setSelectedAnswer(answer);
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);

    // Pass the kfzCode for error tracking
    await recordQuizAnswer(correct, question.kfzCode);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{score.correct}/{score.total}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-8 space-y-6">
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
                    {isCorrect ? 'Super! Das ist richtig!' : `Das war ${question.correctAnswer}`}
                  </p>
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
                  onClick={generateQuestion}
                >
                  Nächste Frage 🚀
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
