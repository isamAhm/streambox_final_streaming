import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';

interface StreamingProvider {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
}

const providers: StreamingProvider[] = [
    {
        id: 'netflix',
        name: 'Netflix',
        icon: '/images/providers/netflix.png',
        color: '#E50914',
        description: 'Original series and movies'
    },
    {
        id: 'amazon-prime',
        name: 'Amazon Prime Video',
        icon: '/images/providers/prime.png',
        color: '#00A8E1',
        description: 'Prime Video originals and movies'
    },
    {
        id: 'disney-plus',
        name: 'Disney+',
        icon: '/images/providers/disney.png',
        color: '#113CCF',
        description: 'Disney, Marvel, Star Wars content'
    },
    {
        id: 'apple-tv',
        name: 'Apple TV+',
        icon: '/images/providers/appletv.png',
        color: '#1D1D1F',
        description: 'Apple TV+ originals'
    },
    {
        id: 'hulu',
        name: 'Hulu',
        icon: '/images/providers/hulu.png',
        color: '#1CE783',
        description: 'TV shows and Hulu originals'
    },
    {
        id: 'hbo-max',
        name: 'HBO Max',
        icon: '/images/providers/hbo.png',
        color: '#672AB7',
        description: 'HBO originals and blockbusters'
    },
    {
        id: 'paramount-plus',
        name: 'Paramount+',
        icon: '/images/providers/paramount.png',
        color: '#0064FF',
        description: 'Paramount and CBS content'
    },
    {
        id: 'peacock',
        name: 'Peacock',
        icon: '/images/providers/peacock.png',
        color: '#00B8A9',
        description: 'NBC Universal content'
    },
    {
        id: 'crunchyroll',
        name: 'Crunchyroll',
        icon: '/images/providers/crunchyroll.png',
        color: '#FF6B00',
        description: 'Anime and manga content'
    },
    {
        id: 'starz',
        name: 'Starz',
        icon: '/images/providers/starz.png',
        color: '#000000',
        description: 'Premium movies and series'
    },
    {
        id: 'amc-plus',
        name: 'AMC+',
        icon: '/images/providers/amc.png',
        color: '#FFCC00',
        description: 'AMC originals and classics'
    },
    {
        id: 'mgm-plus',
        name: 'MGM+',
        icon: '/images/providers/mgm.png',
        color: '#B8860B',
        description: 'MGM movies and series'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: '/images/providers/youtube.png',
        color: '#FF0000',
        description: 'YouTube Premium content'
    },
    {
        id: 'tubi',
        name: 'Tubi',
        icon: '/images/providers/tubi.png',
        color: '#FA541C',
        description: 'Free movies and TV shows'
    }
];

const BrowseByProvider: React.FC = () => {
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();

    const handleProviderClick = (providerId: string) => {
        setSelectedProvider(providerId);
        // Navigate to provider-specific page or filter
        router.push(`/browse/provider/${providerId}`);
    };

    const visibleProviders = isExpanded ? providers : providers.slice(0, 7);
    const remainingCount = providers.length - 7;

    return (
        <section className="py-16 bg-gradient-to-b from-black via-gray-900 to-black">
            <div className="container mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Browse by Provider
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Discover content from your favorite streaming platforms
                    </p>
                </motion.div>

                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, staggerChildren: 0.1 }}
                    >
                        <AnimatePresence>
                            {visibleProviders.map((provider, index) => (
                                <motion.div
                                    key={provider.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative cursor-pointer"
                                    onClick={() => handleProviderClick(provider.id)}
                                >
                                    <div className="relative p-4 bg-gray-800/50 hover:bg-gray-700/60 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-gray-700/30 hover:border-gray-600/50">
                                        {/* Provider Icon */}
                                        <div className="relative mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                                            <div
                                                className="w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
                                                style={{ backgroundColor: `${provider.color}20` }}
                                            >
                                                <img
                                                    src={provider.icon}
                                                    alt={provider.name}
                                                    className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        // Fallback to text if image fails to load
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = `<span class="text-white font-bold text-xs">${provider.name.slice(0, 3).toUpperCase()}</span>`;
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Glow effect */}
                                            <div
                                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                                                style={{ backgroundColor: provider.color }}
                                            />
                                        </div>

                                        {/* Provider Name */}
                                        <h3 className="text-white text-sm font-semibold text-center mb-1 line-clamp-1">
                                            {provider.name}
                                        </h3>

                                        {/* Provider Description */}
                                        <p className="text-gray-400 text-xs text-center line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                                            {provider.description}
                                        </p>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Show More/Less Button */}
                    {providers.length > 7 && (
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="inline-flex items-center px-6 py-3 bg-gray-800/60 hover:bg-gray-700/60 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700/30 hover:border-gray-600/50"
                            >
                                <span className="mr-2">
                                    {isExpanded ? 'Show Less' : `Show ${remainingCount} More`}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                                        }`}
                                />
                            </motion.button>
                        </motion.div>
                    )}
                </div>

                {/* Selected Provider Info */}
                <AnimatePresence>
                    {selectedProvider && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-12 text-center"
                        >
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
                                <p className="text-gray-300">
                                    Browsing content from{' '}
                                    <span className="text-white font-semibold">
                                        {providers.find(p => p.id === selectedProvider)?.name}
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default BrowseByProvider;