import React, { useState } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, XMarkIcon, FilmIcon } from '@heroicons/react/24/outline';

interface Movie {
    id: string;
    title: string;
    thumbnailUrl: string;
    imdbId: string;
    tmdbId?: number;
    type?: string;
    year?: number;
    rating?: number;
}

interface ContentPickerProps {
    isHost: boolean;
    onSelect: (movie: Movie) => void;
    onClose: () => void;
}

const ContentPicker: React.FC<ContentPickerProps> = ({ isHost, onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isHost) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await axios.get(`/api/movies/search?query=${encodeURIComponent(query)}`);
            setResults(res.data?.results || res.data || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <FilmIcon className="w-5 h-5 text-white" />
                        <h2 className="text-white font-semibold">Choose a Movie</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="p-4 flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search movies and shows..."
                        className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-white placeholder-zinc-500"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="bg-white hover:bg-gray-200 text-black px-4 py-2.5 rounded-lg transition"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                    </button>
                </form>

                {/* Results */}
                <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
                        </div>
                    )}
                    {!loading && results.length === 0 && query && (
                        <p className="text-zinc-500 text-sm text-center py-8">No results found</p>
                    )}
                    {!loading && results.map((movie) => (
                        <button
                            key={movie.id}
                            onClick={() => { onSelect(movie); onClose(); }}
                            className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition text-left group"
                        >
                            <img
                                src={movie.thumbnailUrl}
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                                    {movie.year && <span>{movie.year}</span>}
                                    {movie.type && <span>• {movie.type === 'tv' ? 'TV Show' : 'Movie'}</span>}
                                    {movie.rating && <span>• ★ {movie.rating.toFixed(1)}</span>}
                                </div>
                            </div>
                            <span className="text-zinc-500 group-hover:text-white text-xs transition shrink-0">Select</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContentPicker;
