import React from 'react';
import { useRouter } from 'next/router';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface GuestPromptProps {
    feature: string;
    message?: string;
    onClose?: () => void;
    size?: 'small' | 'medium' | 'large';
}

const GuestPrompt: React.FC<GuestPromptProps> = ({
    feature,
    message,
    onClose,
    size = 'medium'
}) => {
    const router = useRouter();

    const sizeClasses = {
        small: 'max-w-sm p-4',
        medium: 'max-w-md p-6',
        large: 'max-w-lg p-8'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className={`bg-zinc-900 border border-zinc-700 rounded-2xl ${sizeClasses[size]} w-full shadow-2xl animate-fadeIn`}>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                )}

                <div className="text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h3 className="text-white text-2xl font-bold mb-2">
                        Create an Account
                    </h3>

                    <p className="text-zinc-400 mb-1">
                        {message || `Sign up to unlock ${feature}`}
                    </p>

                    <p className="text-zinc-500 text-sm mb-6">
                        It&apos;s free and takes less than a minute!
                    </p>

                    {/* Benefits List */}
                    <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-white font-semibold mb-3 text-sm">With an account you can:</p>
                        <ul className="space-y-2 text-sm text-zinc-300">
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Save to your Watchlist</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Track your watch progress</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Create Cinema Rooms</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Get personalized recommendations</span>
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
                        >
                            Create Free Account
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-full text-zinc-400 hover:text-zinc-300 text-sm transition"
                            >
                                Continue as Guest
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestPrompt;
