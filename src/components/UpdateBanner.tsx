/**
 * Update Banner - User-facing notification for app updates
 * Shows at bottom of screen when update is available
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdate } from '@/contexts/UpdateContext';

export default function UpdateBanner() {
  const { updateAvailable, installUpdate, dismissUpdate } = useUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="container max-w-lg mx-auto">
        <div className="bg-card rounded-2xl p-4 shadow-card border-2 border-primary/30 relative">
          <button
            onClick={dismissUpdate}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Hinweis schließen"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="text-3xl">🚀</div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-display font-bold text-sm">
                  Update verfügbar!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Neue KFZ-Daten sind verfügbar.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissUpdate}
                  className="rounded-xl"
                >
                  Später
                </Button>
                <Button
                  size="sm"
                  onClick={installUpdate}
                  className="gradient-primary text-primary-foreground rounded-xl"
                >
                  Jetzt aktualisieren →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
