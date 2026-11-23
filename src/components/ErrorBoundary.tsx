import {Component, type ErrorInfo, type ReactNode} from 'react';
import {RotateCcw} from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, errorMessage: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component ErrorBoundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({hasError: false, errorMessage: ''});
  };

  render() {
    if (this.state.hasError) {
      let friendlyMessage = 'Unable to connect cleanly right now. Please try again in a moment.';
      try {
        const parsed = JSON.parse(this.state.errorMessage) as {error?: string};
        if (parsed?.error) {
          friendlyMessage = parsed.error.includes('Missing or insufficient permissions')
            ? 'Guestbook permissions could not be verified. Please refresh or try again.'
            : parsed.error;
        }
      } catch {
        // use generic safe message
      }

      return (
        <div className="rounded-2xl aero-chrome-panel p-6 text-center">
          <p className="font-display text-lg font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </p>
          <p className="mt-2 text-sm text-[#40566E] dark:text-[#9EB6CF]">{friendlyMessage}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold aero-btn-silver"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
