import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

const LiveTV = () => {
    const router = useRouter();
    const [channelsData, setChannelsData] = useState<ChannelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCountry, setFilterCountry] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'all' | 'byCountry'>('all');

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

    const countries = Array.from(new Set(channelsData?.channels.map(ch => ch.code) || [])).sort();

    const filteredChannels = channelsData?.channels.filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCountry = filterCountry === 'all' || channel.code === filterCountry;
        return matchesSearch && matchesCountry;
    }) || [];

    const groupedByCountry = React.useMemo(() => {
        if (!channelsData) return [];
        const groups = channelsData.channels.reduce((acc, channel) => {
            if (!acc[channel.code]) {
                acc[channel.code] = {
                    code: channel.code,
                    name: channel.code.toUpperCase(),
                    flag: `https://flagcdn.com/w40/${channel.code}.png`,
                    channels: [],
                };
            }
            acc[channel.code].channels.push(channel);
            return acc;
        }, {} as Record<string, any>);
        return Object.values(groups).sort((a: any, b: any) => b.channels.length - a.channels.length);
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
                    <span className="text-sm font-medium hidden md:inline">Back to Channels</span>
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

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <div className="pt-24 pb-12 px-4 md:px-16">
                {/* <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to Home</span>
                </button> */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Live TV</h1>
                        <p className="text-gray-400">
                            {channelsData ? `${channelsData.total_channels} channels from around the world` : 'Loading...'}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${viewMode === 'all'
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            All Channels
                        </button>
                        <button
                            onClick={() => setViewMode('byCountry')}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${viewMode === 'byCountry'
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            By Country
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-white">Loading channels...</div>
                    </div>
                ) : viewMode === 'all' ? (
                    <>
                        {/* Search and Filter */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search channels..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 text-white rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
                                />
                            </div>
                            <select
                                value={filterCountry}
                                onChange={(e) => setFilterCountry(e.target.value)}
                                className="px-4 py-3 bg-zinc-800 text-white rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
                            >
                                <option value="all">All Countries</option>
                                {countries.map(code => (
                                    <option key={code} value={code}>{code.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {/* Channels Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {filteredChannels.map((channel) => (
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
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-400 uppercase">{channel.code}</span>
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

                        {filteredChannels.length === 0 && (
                            <div className="text-center text-gray-400 py-12">
                                No channels found matching your criteria
                            </div>
                        )}
                    </>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {groupedByCountry.map((group: any) => (
                            <div
                                key={group.code}
                                onClick={() => router.push(`/collections?country=${group.code}`)}
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
            </div>
        </div>
    );
};

export default LiveTV;
