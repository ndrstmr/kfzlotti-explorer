import { useState } from 'react';
import { MapPin, Tag, Map, Building, Info } from 'lucide-react';
import type { SearchResult } from '@/lib/search';
import type { CodeDetailsData } from '@/data/schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ResultCardsProps {
  results: SearchResult[];
  codeDetails?: CodeDetailsData | null;
}

const ResultCards = ({ results, codeDetails }: ResultCardsProps) => {
  const result = results[0]; // Show first result (most relevant)
  const [selectedBadge, setSelectedBadge] = useState<{ code: string; origin: string; note?: string; type?: string } | null>(null);

  if (!result) return null;

  const getCodeDetail = (code: string) => {
    if (!codeDetails?.codes) return null;
    return codeDetails.codes[code.toUpperCase()];
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4 animate-fade-in">
        {/* Main Result Card */}
        <div className="bg-card rounded-3xl p-6 shadow-card overflow-hidden relative">
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-bl-full opacity-30" />
          
          <div className="relative z-10 space-y-4">
            {/* KFZ Code Badge */}
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-full font-display font-bold text-xl cursor-help">
                    <Tag className="w-5 h-5" />
                    {result.kfzCode}
                    {getCodeDetail(result.kfzCode) && (
                      <Info className="w-4 h-4 opacity-70" />
                    )}
                  </div>
                </TooltipTrigger>
                {getCodeDetail(result.kfzCode) && (
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-semibold">{result.kfzCode} = {getCodeDetail(result.kfzCode)?.origin}</p>
                    {getCodeDetail(result.kfzCode)?.note && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getCodeDetail(result.kfzCode)?.note}
                      </p>
                    )}
                    {getCodeDetail(result.kfzCode)?.type === 'historic' && (
                      <span className="inline-block mt-1 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                        Altkennzeichen
                      </span>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
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
              {result.kfzCodes.map((code) => {
                const detail = getCodeDetail(code);
                const badgeContent = (
                  <span
                    className={`px-2 py-0.5 rounded-md text-sm font-bold inline-flex items-center gap-1 transition-colors ${
                      detail ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
                    } ${
                      code === result.kfzCode
                        ? 'bg-primary/20 text-primary'
                        : detail?.type === 'historic'
                        ? 'bg-secondary/10 text-secondary border border-secondary/30'
                        : detail
                        ? 'bg-muted text-muted-foreground border-2 border-dashed border-primary/40'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => detail && setSelectedBadge({ code, origin: detail.origin, note: detail.note, type: detail.type })}
                  >
                    {code}
                    {detail && <span className="text-[10px] opacity-60">ⓘ</span>}
                  </span>
                );

                // Desktop: Tooltip on hover, Mobile: Click to open dialog
                return (
                  <Tooltip key={code}>
                    <TooltipTrigger asChild className="hidden md:inline-flex">
                      {badgeContent}
                    </TooltipTrigger>
                    <span key={`${code}-mobile`} className="md:hidden">
                      {badgeContent}
                    </span>
                    {detail && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold">{code} = {detail.origin}</p>
                        {detail.note && (
                          <p className="text-xs text-muted-foreground mt-1">{detail.note}</p>
                        )}
                        {detail.type === 'historic' && (
                          <span className="inline-block mt-1 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                            Altkennzeichen
                          </span>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
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

      {/* Badge Detail Dialog (Mobile only) */}
      <AlertDialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-display">
              {selectedBadge?.code}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-2">
              <p className="font-semibold text-foreground">{selectedBadge?.origin}</p>
              {selectedBadge?.note && (
                <p className="text-sm text-muted-foreground">{selectedBadge.note}</p>
              )}
              {selectedBadge?.type === 'historic' && (
                <span className="inline-block text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                  Altkennzeichen
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Button
            onClick={() => setSelectedBadge(null)}
            className="mt-4"
          >
            Schließen
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default ResultCards;
