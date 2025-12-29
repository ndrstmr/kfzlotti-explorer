import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Fängt React-Fehler ab und zeigt eine Fallback-UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state, damit der nächste Render die Fallback-UI zeigt
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Error-Logging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Hier könnte man den Fehler an einen Service wie Sentry senden:
    // if (import.meta.env.PROD && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            {/* Error Icon */}
            <div className="text-center">
              <div className="text-8xl mb-4 animate-bounce-subtle">🚗💥</div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Ups, da ist was schiefgelaufen!
              </h1>
              <p className="text-muted-foreground">
                KFZlotti hat einen Fehler festgestellt. Keine Sorge, deine Daten sind sicher!
              </p>
            </div>

            {/* Error Details (nur im Development) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-destructive/10 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Error Details (nur im Development sichtbar):
                </p>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full gradient-primary text-primary-foreground py-6 text-lg font-display font-bold rounded-2xl"
              >
                🔄 Nochmal versuchen
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full py-6 text-lg font-display rounded-2xl"
              >
                ↻ App neu laden
              </Button>
            </div>

            {/* Support Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Problem bleibt bestehen?{' '}
                <a
                  href="https://github.com/ndrstmr/kfzlotti-explorer/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fehler melden
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
