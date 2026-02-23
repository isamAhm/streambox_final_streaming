import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ClerkErrorBoundaryClass extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Check if it's a Clerk-related error
        if (
            error.message?.includes('ClerkJS') ||
            error.message?.includes('Token refresh failed') ||
            error.message?.includes('Network error')
        ) {
            return {
                hasError: true,
                error,
                errorInfo: null,
            };
        }
        // Let other errors bubble up
        return {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Clerk Error Boundary caught an error:', error, errorInfo);
        }

        // In production, you could send this to an error tracking service
        // Example: Sentry, LogRocket, etc.
        if (process.env.NODE_ENV === 'production') {
            // logErrorToService(error, errorInfo);
        }

        this.setState({
            errorInfo,
        });
    }

    handleRetry = () => {
        // Clear error state
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Reload the page to get fresh tokens
        window.location.reload();
    };

    handleSignOut = () => {
        // Clear all local storage and cookies
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to auth page
        window.location.href = '/auth';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-zinc-900 rounded-lg p-8 text-center">
                        <div className="mb-6">
                            <svg
                                className="w-16 h-16 text-red-500 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <h1 className="text-white text-2xl font-bold mb-2">
                                Session Expired
                            </h1>
                            <p className="text-gray-400 text-sm mb-4">
                                Your session has expired or there was a network issue. Please try again.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded text-left">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                            <button
                                onClick={this.handleSignOut}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Sign Out & Restart
                            </button>
                        </div>

                        <p className="text-gray-500 text-xs mt-6">
                            If this problem persists, please clear your browser cache and cookies.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to use hooks
export default function ClerkErrorBoundary({ children }: Props) {
    return <ClerkErrorBoundaryClass>{children}</ClerkErrorBoundaryClass>;
}
