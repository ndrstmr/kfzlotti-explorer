import { MapPin, Tag, Map, Building } from 'lucide-react';
import type { SearchResult } from '@/lib/search';

interface ResultCardsProps {
  results: SearchResult[];
}

const ResultCards = ({ results }: ResultCardsProps) => {
  const result = results[0]; // Show first result (most relevant)
  
  if (!result) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Result Card */}
      <div className="bg-card rounded-3xl p-6 shadow-card overflow-hidden relative">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-bl-full opacity-30" />
        
        <div className="relative z-10 space-y-4">
          {/* KFZ Code Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-full font-display font-bold text-xl">
              <Tag className="w-5 h-5" />
              {result.kfzCode}
            </div>
            <span className="text-3xl">🚗</span>
          </div>

          {/* Kreis Name */}
          <div className="pt-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Landkreis / Stadt
            </p>
            <h2 className="text-2xl font-display font-bold text-foreground mt-1">
              {result.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bundesland Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Map className="w-4 h-4" />
            <span className="text-xs font-medium">Bundesland</span>
          </div>
          <p className="font-display font-bold text-lg">{result.bundesland}</p>
          <p className="text-xs text-muted-foreground">{result.bundeslandShort}</p>
        </div>

        {/* Alternative Codes Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 text-info mb-2">
            <Building className="w-4 h-4" />
            <span className="text-xs font-medium">Alle Kürzel</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.kfzCodes.map((code) => (
              <span
                key={code}
                className={`px-2 py-0.5 rounded-md text-sm font-bold ${
                  code === result.kfzCode
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Multiple Results Hint */}
      {results.length > 1 && (
        <p className="text-center text-sm text-muted-foreground">
          ℹ️ Dieses Kürzel wird von {results.length} Kreisen verwendet
        </p>
      )}
    </div>
  );
};

export default ResultCards;
