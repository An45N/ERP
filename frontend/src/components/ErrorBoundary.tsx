import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    An unexpected error occurred in the application
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-mono text-sm text-red-800">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-sm">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3">
                  <Button onClick={this.handleReset} className="flex-1">
                    Return to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  If this problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
