import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {return this.props.fallback;}
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8 text-center"
          data-testid="error-boundary"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              An unexpected error occurred. Refreshing the page or clicking below should fix it.
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error details
                </summary>
                <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-auto max-w-lg whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <Button onClick={this.handleReset} data-testid="button-reset-error">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
