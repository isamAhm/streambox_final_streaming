import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { FilmIcon, LinkIcon, UserGroupIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';

export default function CinemaRoomLobby() {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useUser();
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [showComingSoon, setShowComingSoon] = useState(false);

    if (isLoaded && !isSignedIn) {
        router.push('/auth');
        return null;
    }

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim();
        if (!code) return;

        const roomId = code.includes('/') ? code.split('/').pop()! : code;
        setJoining(true);
        setJoinError('');

        try {
            const res = await fetch(`/api/cinema-room/${roomId}/join`, { method: 'POST' });
            if (!res.ok) {
                setJoinError('Room not found. Check the code and try again.');
                setJoining(false);
                return;
            }
            router.push(`/cinema-room/${roomId}`);
        } catch {
            setJoinError('Room not found. Check the code and try again.');
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <div className="pt-32 pb-16 px-4 md:px-12">
                {/* Hero */}
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="bg-zinc-800 rounded-full p-4">
                            <FilmIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Cinema Room</h1>
                    <p className="text-gray-400 text-lg">
                        Watch movies in sync with friends. Create a room, share the link, and enjoy together.
                    </p>
                </div>

                {/* Cards */}
                <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-6">
                    {/* Create Room */}
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-lg p-2">
                                <UserGroupIcon className="w-5 h-5 text-black" />
                            </div>
                            <h2 className="text-white font-semibold text-lg">Create a Room</h2>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Start a new Cinema Room and invite friends with a shareable link.
                        </p>
                        <button
                            onClick={() => setShowComingSoon(true)}
                            className="mt-auto w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-lg transition"
                        >
                            Create Room
                        </button>
                    </div>

                    {/* Join Room */}
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-zinc-700 rounded-lg p-2">
                                <LinkIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-white font-semibold text-lg">Join a Room</h2>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Paste a room link or code to join a friend&apos;s Cinema Room.
                        </p>
                        <form onSubmit={handleJoin} className="flex flex-col gap-3 mt-auto">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                                placeholder="Paste room link or code..."
                                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-1 focus:ring-white text-sm placeholder-gray-500"
                            />
                            {joinError && (
                                <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{joinError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={joining}
                                className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
                            >
                                {joining ? 'Checking...' : 'Join Room'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* How it works */}
                <div className="max-w-2xl mx-auto mt-12">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">How it works</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { step: '1', label: 'Create a room and copy the link' },
                            { step: '2', label: 'Share the link with friends' },
                            { step: '3', label: 'Pick a movie and watch in sync' },
                        ].map(({ step, label }) => (
                            <div key={step} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center">
                                <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                                    {step}
                                </div>
                                <p className="text-gray-400 text-xs">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coming Soon Modal */}
            {showComingSoon && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl relative">
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>

                        <div className="flex justify-center mb-5">
                            <div className="bg-zinc-800 rounded-full p-4">
                                <SparklesIcon className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        <h2 className="text-white text-2xl font-bold mb-3">Coming Soon</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                            Cinema Room is currently under development. We&apos;re working on bringing you a seamless
                            watch-together experience with full sync support. Stay tuned!
                        </p>

                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-lg transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
