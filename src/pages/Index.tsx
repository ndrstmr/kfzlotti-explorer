import { useState, useEffect } from 'react';
import { Search, HelpCircle, Info, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKfzData } from '@/hooks/useKfzData';
import { searchKfzCode, type SearchResult } from '@/lib/search';
import { normalizeKfzCode } from '@/lib/normalize';
import { recordSearch } from '@/lib/storage';
import { useOnlineStatus } from '@/lib/pwa';
import ResultCards from '@/components/ResultCards';
import InstallHint from '@/components/InstallHint';
import { Link } from 'react-router-dom';

const Index = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { index, codeDetails, isLoading, error } = useKfzData();
  const isOnline = useOnlineStatus();

  // Search when query changes
  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([]);
      return;
    }

    const normalized = normalizeKfzCode(query);
    if (normalized.length > 0) {
      const found = searchKfzCode(normalized, index);
      setResults(found);
      setHasSearched(true);

      // Record search for first result
      if (found.length > 0) {
        recordSearch(found[0].id);
      }
    }
  }, [query, index]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '').slice(0, 3);
    setQuery(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
              <span className="text-3xl">🚗</span>
              KFZlotti
            </h1>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-primary-foreground/80" />
              ) : (
                <WifiOff className="w-5 h-5 text-primary-foreground/80" />
              )}
              <Link to="/info">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                  <Info className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-primary-foreground/90 text-lg font-medium">
            Kürzel rein, Kreis raus! 🎯
          </p>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Gib ein Kürzel ein (z.B. HH, M, B)"
            value={query}
            onChange={handleInputChange}
            className="pl-14 pr-4 py-6 text-xl font-display font-semibold text-center rounded-2xl border-2 border-primary/30 focus:border-primary shadow-soft transition-all"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="KFZ-Kürzel eingeben"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin-slow text-4xl mb-2">🚗</div>
            <p className="text-muted-foreground">Daten werden geladen...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-2xl p-4 text-center">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <ResultCards results={results} codeDetails={codeDetails} />
        )}

        {/* No Results */}
        {!isLoading && hasSearched && query.length > 0 && results.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">🤔</div>
            <p className="text-lg font-medium text-muted-foreground">
              Hmm, „{query}" kenne ich nicht...
            </p>
            <p className="text-sm text-muted-foreground">
              Probier mal ein anderes Kürzel!
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasSearched && (
          <div className="text-center py-8 space-y-6">
            <div className="text-6xl animate-bounce-subtle">🔍</div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Welches Kennzeichen siehst du?</p>
              <p className="text-muted-foreground">
                Gib die ersten Buchstaben ein und finde heraus, woher das Auto kommt!
              </p>
            </div>

            {/* Quick Examples */}
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {['B', 'HH', 'M', 'K', 'F'].map((code) => (
                <Button
                  key={code}
                  variant="outline"
                  className="rounded-xl font-display font-bold text-lg px-4 py-2 border-2 hover:border-primary hover:bg-primary/10 transition-all"
                  onClick={() => setQuery(code)}
                >
                  {code}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          <Link to="/quiz" className="flex-1">
            <Button className="w-full gradient-secondary text-secondary-foreground rounded-2xl py-6 text-lg font-display font-bold shadow-soft hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5 mr-2" />
              Quiz spielen
            </Button>
          </Link>
        </div>

        {/* Install Hint */}
        <InstallHint />

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground px-4 pt-4">
          💡 Tipp: Ein Kennzeichen zeigt nicht immer, wo jemand wohnt. 
          Man kann sein altes Kennzeichen nach einem Umzug behalten!
        </p>
      </main>
    </div>
  );
};

export default Index;
