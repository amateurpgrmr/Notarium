import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Here you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              textAlign: 'center',
              padding: '2rem',
              borderRadius: '12px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
            }}
          >
            <AlertCircle
              size={64}
              style={{
                color: '#ef4444',
                marginBottom: '1.5rem',
              }}
            />

            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#888',
                marginBottom: '2rem',
                lineHeight: '1.6',
              }}
            >
              We're sorry, but an unexpected error occurred. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginBottom: '2rem',
                  textAlign: 'left',
                  backgroundColor: '#0a0a0a',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  cursor: 'pointer',
                }}
              >
                <summary
                  style={{
                    color: '#ef4444',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                  }}
                >
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    fontSize: '0.875rem',
                    color: '#888',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                <RefreshCw size={18} />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
