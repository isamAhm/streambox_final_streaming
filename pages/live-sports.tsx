import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface Channel {
    channel_name: string;
    channel_code: string;
    viewers: string;
    url: string;
    image: string;
}

interface SportsEvent {
    gameID: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamIMG: string;
    awayTeamIMG: string;
    time: string;
    tournament: string;
    country: string;
    countryIMG: string;
    status: string;
    start: string;
    end: string;
    channels: Channel[];
}

interface SportsData {
    Soccer?: SportsEvent[];
    NFL?: SportsEvent[];
    NBA?: SportsEvent[];
    NHL?: SportsEvent[];
    total_events: number;
    total_events_soccer?: number;
    total_events_nfl?: number;
    total_events_nba?: number;
    total_events_nhl?: number;
}

const LiveSports = () => {
    const router = useRouter();
    const [sportsData, setSportsData] = useState<SportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<SportsEvent | null>(null);
    const [activeTab, setActiveTab] = useState<'Soccer' | 'NFL' | 'NBA' | 'NHL'>('Soccer');

    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await fetch('https://api.cdnlivetv.is/api/v1/events/sports/?user=cdnlivetv&plan=free');
                const data = await response.json();
                setSportsData(data['cdnlivetv.is']);
            } catch (error) {
                console.error('Error fetching sports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSports();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'live': return 'bg-red-600';
            case 'upcoming': return 'bg-blue-600';
            case 'finished': return 'bg-gray-600';
            default: return 'bg-gray-600';
        }
    };

    const tabs = [
        { key: 'Soccer' as const, label: 'Soccer', count: sportsData?.total_events_soccer || 0 },
        { key: 'NFL' as const, label: 'NFL', count: sportsData?.total_events_nfl || 0 },
        { key: 'NBA' as const, label: 'NBA', count: sportsData?.total_events_nba || 0 },
        { key: 'NHL' as const, label: 'NHL', count: sportsData?.total_events_nhl || 0 },
    ];

    if (selectedEvent) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
                <Navbar />

                <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-20 left-4 z-50 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-gray-700/50 hover:border-gray-600"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-medium hidden md:inline">Back to Events</span>
                </button>

                <div className="flex-1 w-full pt-16">
                    <iframe
                        src={selectedEvent.channels[0]?.url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="encrypted-media"
                        title={`${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}`}
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

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Live Sports</h1>
                <p className="text-gray-400 mb-8">Watch live sporting events from around the world</p>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-white">Loading sports events...</div>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-4 px-4 text-lg font-semibold transition whitespace-nowrap ${activeTab === tab.key
                                        ? 'text-white border-b-2 border-red-600'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {tab.label} {tab.count > 0 && `(${tab.count})`}
                                </button>
                            ))}
                        </div>

                        {/* Events Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sportsData?.[activeTab]?.map((event) => (
                                <div
                                    key={event.gameID}
                                    className="bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-700 transition cursor-pointer"
                                    onClick={() => event.channels.length > 0 && setSelectedEvent(event)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(event.status)}`}>
                                                {event.status.toUpperCase()}
                                            </span>
                                            <span className="text-gray-400 text-sm">{event.time}</span>
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <img src={event.homeTeamIMG} alt={event.homeTeam} className="w-12 h-12 object-contain" />
                                                <span className="text-white font-semibold">{event.homeTeam}</span>
                                            </div>
                                        </div>

                                        <div className="text-center text-gray-500 text-sm mb-4">VS</div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <img src={event.awayTeamIMG} alt={event.awayTeam} className="w-12 h-12 object-contain" />
                                                <span className="text-white font-semibold">{event.awayTeam}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-700 pt-4 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                <img src={event.countryIMG} alt={event.country} className="w-5 h-4" />
                                                <span>{event.tournament}</span>
                                            </div>
                                            {event.channels.length > 0 ? (
                                                <div className="flex items-center gap-2 text-sm text-green-400">
                                                    <span>📺 {event.channels.length} channel{event.channels.length > 1 ? 's' : ''} available</span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">No stream available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {sportsData?.[activeTab]?.length === 0 && (
                            <div className="text-center text-gray-400 py-12">
                                No {activeTab} events available at the moment
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LiveSports;
