import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface Channel {
    name: string;
    code: string;
    url: string;
    image: string;
    status: string;
    viewers: number;
}

interface ChannelsData {
    total_channels: number;
    channels: Channel[];
}

interface CountryGroup {
    code: string;
    name: string;
    flag: string;
    channels: Channel[];
}

const countryNames: Record<string, string> = {
    us: 'United States',
    gb: 'United Kingdom',
    fr: 'France',
    de: 'Germany',
    au: 'Australia',
    pt: 'Portugal',
    pl: 'Poland',
    ca: 'Canada',
    br: 'Brazil',
    bg: 'Bulgaria',
    dk: 'Denmark',
    es: 'Spain',
    gr: 'Greece',
    il: 'Israel',
    at: 'Austria',
    nz: 'New Zealand',
    nl: 'Netherlands',
    tr: 'Turkey',
    cy: 'Cyprus',
    se: 'Sweden',
    ro: 'Romania',
    sa: 'Saudi Arabia',
    it: 'Italy',
    ru: 'Russia',
    ar: 'Argentina',
    mx: 'Mexico',
    ae: 'UAE',
    cz: 'Czech Republic',
    be: 'Belgium',
    cl: 'Chile',
    uy: 'Uruguay',
};

const Collections = () => {
    const router = useRouter();
    const { country } = router.query;
    const [channelsData, setChannelsData] = useState<ChannelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    React.useEffect(() => {
        if (country && typeof country === 'string') {
            setSelectedCountry(country);
        }
    }, [country]);

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await fetch('https://api.cdnlivetv.is/api/v1/channels/?user=cdnlivetv&plan=free');
                const data = await response.json();
                setChannelsData(data);
            } catch (error) {
                console.error('Error fetching channels:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();
    }, []);

    const groupedByCountry: CountryGroup[] = React.useMemo(() => {
        if (!channelsData) return [];

        const groups = channelsData.channels.reduce((acc, channel) => {
            if (!acc[channel.code]) {
                acc[channel.code] = {
                    code: channel.code,
                    name: countryNames[channel.code] || channel.code.toUpperCase(),
                    flag: `https://flagcdn.com/w40/${channel.code}.png`,
                    channels: [],
                };
            }
            acc[channel.code].channels.push(channel);
            return acc;
        }, {} as Record<string, CountryGroup>);

        return Object.values(groups).sort((a, b) => b.channels.length - a.channels.length);
    }, [channelsData]);

    if (selectedChannel) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
                <Navbar />

                <button
                    onClick={() => setSelectedChannel(null)}
                    className="absolute top-20 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-medium hidden md:inline">Back</span>
                </button>

                <div className="flex-1 w-full pt-16">
                    <iframe
                        src={selectedChannel.url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="encrypted-media"
                        title={selectedChannel.name}
                    />
                </div>
            </div>
        );
    }

    const displayedGroup = selectedCountry
        ? groupedByCountry.find(g => g.code === selectedCountry)
        : null;

    return (
        <div className="min-h-screen bg-zinc-900">
            <Navbar />

            <div className="pt-24 pb-12 px-4 md:px-16">
                {selectedCountry && displayedGroup ? (
                    <>
                        <button
                            onClick={() => {
                                setSelectedCountry(null);
                                router.push('/live-tv');
                            }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Back to Live TV</span>
                        </button>

                        <div className="flex items-center gap-3 mb-8">
                            <img src={displayedGroup.flag} alt={displayedGroup.name} className="w-10 h-8" />
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white">{displayedGroup.name}</h1>
                                <p className="text-gray-400">{displayedGroup.channels.length} channels available</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {displayedGroup.channels.map((channel) => (
                                <div
                                    key={`${channel.name}-${channel.code}`}
                                    onClick={() => channel.status === 'online' && setSelectedChannel(channel)}
                                    className={`bg-zinc-800 rounded-lg overflow-hidden transition ${channel.status === 'online'
                                        ? 'hover:bg-zinc-700 cursor-pointer hover:scale-105'
                                        : 'opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="aspect-video bg-zinc-900 flex items-center justify-center p-4">
                                        <img
                                            src={channel.image}
                                            alt={channel.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-white font-semibold text-sm truncate">{channel.name}</h3>
                                        <div className="mt-2">
                                            {channel.status === 'online' ? (
                                                <span className="text-xs text-green-400">● Online</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">● Offline</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Back to Home</span>
                        </button>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Channels by Country</h1>
                        <p className="text-gray-400 mb-8">
                            {channelsData ? `Browse ${channelsData.total_channels} channels from ${groupedByCountry.length} countries` : 'Loading...'}
                        </p>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-white">Loading channels...</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {groupedByCountry.map((group) => (
                                    <div
                                        key={group.code}
                                        onClick={() => setSelectedCountry(group.code)}
                                        className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition cursor-pointer hover:scale-105"
                                    >
                                        <img
                                            src={group.flag}
                                            alt={group.name}
                                            className="w-16 h-12 mx-auto mb-4 object-cover rounded"
                                        />
                                        <h3 className="text-white font-semibold text-center mb-2">{group.name}</h3>
                                        <p className="text-gray-400 text-center text-sm">{group.channels.length} channels</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Collections;
