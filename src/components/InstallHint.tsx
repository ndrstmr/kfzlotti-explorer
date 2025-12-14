import { useState, useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt, isIos, isIosSafari, isPwaInstalled } from '@/lib/pwa';

const InstallHint = () => {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // Check if we should show iOS hint
    if (isIos() && isIosSafari() && !isPwaInstalled()) {
      const dismissedBefore = localStorage.getItem('ios-install-hint-dismissed');
      if (!dismissedBefore) {
        setShowIosHint(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (showIosHint) {
      localStorage.setItem('ios-install-hint-dismissed', 'true');
      setShowIosHint(false);
    }
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setDismissed(true);
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Show iOS-specific hint
  if (showIosHint) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border-2 border-primary/30 relative animate-fade-in">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Hinweis schließen"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3 pr-6">
          <div className="text-3xl">📱</div>
          <div className="space-y-2">
            <p className="font-display font-bold text-sm">
              App installieren
            </p>
            <p className="text-xs text-muted-foreground">
              Tippe auf{' '}
              <Share2 className="w-3 h-3 inline-block mx-1" />
              <strong>Teilen</strong> und dann auf{' '}
              <strong>„Zum Home-Bildschirm"</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show Android/Chrome install prompt
  if (canInstall) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border-2 border-primary/30 relative animate-fade-in">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Hinweis schließen"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-3 pr-6">
          <div className="text-3xl">📱</div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm mb-2">
              Als App installieren
            </p>
            <Button
              onClick={handleInstall}
              size="sm"
              className="gradient-primary text-primary-foreground rounded-xl"
            >
              <Download className="w-4 h-4 mr-1" />
              Installieren
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallHint;
