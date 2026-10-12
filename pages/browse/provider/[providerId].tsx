import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Info } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import Navbar from '@/components/Navbar';
import { MovieInterface } from '@/types';

interface ProviderPageProps {
    providerId: string;
    providerName: string;
}

// Provider data (should match BrowseByProvider.tsx)
const providerData: { [key: string]: { name: string; color: string; icon: string } } = {
    'netflix': { name: 'Netflix', color: '#E50914', icon: '/images/providers/netflix.png' },
    'amazon-prime': { name: 'Amazon Prime Video', color: '#00A8E1', icon: '/images/providers/prime.png' },
    'disney-plus': { name: 'Disney+', color: '#113CCF', icon: '/images/providers/disney.png' },
    'apple-tv': { name: 'Apple TV+', color: '#1D1D1F', icon: '/images/providers/appletv.png' },
    'hulu': { name: 'Hulu', color: '#1CE783', icon: '/images/providers/hulu.png' },
    'hbo-max': { name: 'HBO Max', color: '#672AB7', icon: '/images/providers/hbo.png' },
    'paramount-plus': { name: 'Paramount+', color: '#0064FF', icon: '/images/providers/paramount.png' },
    'peacock': { name: 'Peacock', color: '#00B8A9', icon: '/images/providers/peacock.svg' },
    'crunchyroll': { name: 'Crunchyroll', color: '#FF6B00', icon: '/images/providers/crunchyroll.svg' },
    'starz': { name: 'Starz', color: '#000000', icon: '/images/providers/starz.svg' },
    'amc-plus': { name: 'AMC+', color: '#FFCC00', icon: '/images/providers/amc.svg' },
    'mgm-plus': { name: 'MGM+', color: '#B8860B', icon: '/images/providers/mgm.svg' },
    'youtube': { name: 'YouTube', color: '#FF0000', icon: '/images/providers/youtube.svg' },
    'tubi': { name: 'Tubi', color: '#FA541C', icon: '/images/providers/tubi.svg' },
};

const ProviderPage: React.FC<ProviderPageProps> = ({ providerId, providerName }) => {
    const router = useRouter();
    const [movies, setMovies] = useState<MovieInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const provider = providerData[providerId];

    useEffect(() => {
        fetchProviderContent();
    }, [providerId]);

    const fetchProviderContent = async () => {
        try {
            setLoading(true);
            setError(null);

            // For now, we'll fetch trending movies as placeholder
            // In a real implementation, you would filter by provider
            const response = await fetch('/api/movies/trending');
            if (!response.ok) {
                throw new Error('Failed to fetch content');
            }

            const data = await response.json();

            // Ensure data is an array and has valid movie objects
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }

            // Filter out any invalid movie objects and validate required fields
            const validMovies = data.filter(movie =>
                movie &&
                typeof movie.id !== 'undefined' &&
                movie.title &&
                movie.thumbnailUrl
            );

            // Simulate provider filtering by showing random subset
            const shuffled = validMovies.sort(() => 0.5 - Math.random());
            const providerContent = shuffled.slice(0, 20);

            setMovies(providerContent);
        } catch (err) {
            console.error('Error fetching provider content:', err);
            setError('Failed to load content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!provider) {
        return (
            <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Provider Not Found</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Go Back Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-900">
            <Head>
                <title>{provider.name} - StreamBox</title>
                <meta name="description" content={`Browse movies and shows from ${provider.name}`} />
            </Head>

            <Navbar />

            {/* Hero Section */}
            <section
                className="relative pt-24 pb-16 px-4 overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${provider.color}20 0%, transparent 50%, ${provider.color}10 100%)`
                }}
            >
                <div className="container mx-auto max-w-7xl">
                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="flex items-center text-white/80 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </motion.button>

                    {/* Provider Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mb-8"
                    >
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mr-6"
                            style={{ backgroundColor: `${provider.color}30` }}
                        >
                            <img
                                src={provider.icon}
                                alt={provider.name}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `<span class="text-white font-bold text-lg">${provider.name.slice(0, 3).toUpperCase()}</span>`;
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                                {provider.name}
                            </h1>
                            <p className="text-xl text-white/80">
                                Browse movies and shows from {provider.name}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 15 }).map((_, index) => (
                        <motion.div
                            key={index}
                            className="absolute rounded-full opacity-30"
                            style={{
                                backgroundColor: provider.color,
                                width: `${Math.random() * 6 + 2}px`,
                                height: `${Math.random() * 6 + 2}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: Math.random() * 3 + 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* Content Section */}
            <section className="px-4 pb-16">
                <div className="container mx-auto max-w-7xl">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-8 max-w-md mx-auto">
                                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Content</h3>
                                <p className="text-red-400 mb-4">{error}</p>
                                <button
                                    onClick={fetchProviderContent}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {!loading && !error && movies.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">
                                Available on {provider.name}
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {movies.map((movie, index) => (
                                    <motion.div
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <MovieCard data={movie} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {!loading && !error && movies.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <div className="bg-gray-800/40 rounded-lg p-8 max-w-md mx-auto">
                                <h3 className="text-xl font-semibold text-white mb-2">No Content Available</h3>
                                <p className="text-gray-400">
                                    We couldn&apos;t find any content for {provider.name} at the moment.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { providerId } = context.params!;
    const provider = providerData[providerId as string];

    if (!provider) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            providerId: providerId as string,
            providerName: provider.name,
        },
    };
};

export default ProviderPage;