import React, { Component, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ClerkErrorBoundaryClass extends Component<Props, State> {
    private toastId: string | null = null;

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

        // Show toast notification
        this.showErrorToast();
    }

    showErrorToast = () => {
        // Dismiss any existing toast
        if (this.toastId) {
            toast.dismiss(this.toastId);
        }

        // Show custom toast with action buttons
        this.toastId = toast.error(
            (t) => (
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="font-semibold text-white">Session Expired</p>
                        <p className="text-sm text-gray-300 mt-1">
                            Your session has expired. Please refresh to continue.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                window.location.reload();
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = '/auth';
                            }}
                            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                style: {
                    background: '#18181b',
                    border: '1px solid #ef4444',
                    maxWidth: '400px',
                },
            }
        ) as string;
    };

    handleRetry = () => {
        // Clear error state
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Dismiss toast
        if (this.toastId) {
            toast.dismiss(this.toastId);
        }

        // Reload the page to get fresh tokens
        window.location.reload();
    };

    handleSignOut = () => {
        // Dismiss toast
        if (this.toastId) {
            toast.dismiss(this.toastId);
        }

        // Clear all local storage and cookies
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to auth page
        window.location.href = '/auth';
    };

    render() {
        // Don't render error UI, let the toast handle it
        // This allows the app to continue rendering while showing the error notification
        return this.props.children;
    }
}

// Wrapper component to use hooks
export default function ClerkErrorBoundary({ children }: Props) {
    return <ClerkErrorBoundaryClass>{children}</ClerkErrorBoundaryClass>;
}
