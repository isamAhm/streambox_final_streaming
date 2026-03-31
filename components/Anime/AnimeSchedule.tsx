import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowTopRightOnSquareIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface AnimeItem {
    id: number;
    title: { romaji: string; english: string | null };
    coverImage: { medium: string };
    format?: string;
    episodes?: number;
    nextAiringEpisode?: { episode: number } | null;
    startDate?: { year: number; month: number; day: number };
    endDate?: { year: number; month: number; day: number };
}

interface AiringSlot {
    airingAt: number;
    episode: number;
    media: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { medium: string };
        format?: string;
    };
}

interface ScheduleData {
    newReleases: AnimeItem[];
    upcoming: AnimeItem[];
    completed: AnimeItem[];
    schedule: AiringSlot[];
}

function formatBadge(format?: string) {
    if (!format) return null;
    const map: Record<string, string> = {
        TV: 'TV', TV_SHORT: 'TV', MOVIE: 'MOVIE', ONA: 'ONA', OVA: 'OVA', SPECIAL: 'SP',
    };
    return map[format] || format;
}

function AnimeListItem({ item, onClick }: { item: AnimeItem; onClick: () => void }) {
    const title = item.title.english || item.title.romaji;
    const badge = formatBadge(item.format);
    const ep = item.nextAiringEpisode?.episode
        ? item.nextAiringEpisode.episode - 1
        : item.episodes;

    return (
        <button onClick={onClick} className="flex items-center gap-3 w-full hover:bg-zinc-800/60 rounded-lg px-3 py-2.5 transition text-left group">
            <img src={item.coverImage.medium} alt={title} className="w-14 h-18 object-cover rounded shrink-0" style={{ height: '4.5rem' }} />
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate group-hover:text-blue-400 transition">{title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {badge && (
                        <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded font-semibold">{badge}</span>
                    )}
                    {ep && <span className="text-xs text-zinc-500">{ep} eps</span>}
                </div>
            </div>
        </button>
    );
}

function ScheduleColumn({ title, items, onItemClick, linkLabel }: {
    title: string;
    items: AnimeItem[];
    onItemClick: (id: number) => void;
    linkLabel?: string;
}) {
    return (
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-base">{title}</h3>
                {linkLabel && (
                    <button className="text-zinc-500 hover:text-white transition">
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="space-y-1">
                {items.map((item) => (
                    <AnimeListItem key={item.id} item={item} onClick={() => onItemClick(item.id)} />
                ))}
            </div>
        </div>
    );
}

// Group airing slots by day
function groupByDay(slots: AiringSlot[]) {
    const groups: Record<string, AiringSlot[]> = {};
    slots.forEach((slot) => {
        const d = new Date(slot.airingAt * 1000);
        const key = d.toDateString();
        if (!groups[key]) groups[key] = [];
        groups[key].push(slot);
    });
    return groups;
}

function getDayTabs(slots: AiringSlot[]) {
    const seen = new Set<string>();
    const days: Date[] = [];
    slots.forEach((slot) => {
        const d = new Date(slot.airingAt * 1000);
        const key = d.toDateString();
        if (!seen.has(key)) { seen.add(key); days.push(d); }
    });
    return days;
}

export default function AnimeSchedule() {
    const router = useRouter();
    const [data, setData] = useState<ScheduleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(0);

    useEffect(() => {
        axios.get('/api/anime/schedule')
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const goToAnime = useCallback((id: number) => router.push(`/anime/${id}`), [router]);

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-800/30 rounded-full" />
                <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin" />
            </div>
        </div>
    );
    if (!data) return null;

    const dayTabs = getDayTabs(data.schedule);
    const grouped = groupByDay(data.schedule);
    const selectedDaySlots = dayTabs[selectedDay]
        ? grouped[dayTabs[selectedDay].toDateString()] || []
        : [];

    const today = new Date();

    return (
        <div className="px-4 md:px-12 pb-12">
            <p className="text-white text-md md:text-xl lg:text-2xl font-semibold mb-4">📅 Schedule & Releases</p>
            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left: 3 columns */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                    <ScheduleColumn title="New Releases" items={data.newReleases} onItemClick={goToAnime} linkLabel="More" />
                    <ScheduleColumn title="Upcoming" items={data.upcoming} onItemClick={goToAnime} linkLabel="More" />
                    <ScheduleColumn title="Completed" items={data.completed} onItemClick={goToAnime} linkLabel="More" />
                </div>

                {/* Right: airing schedule */}
                <div className="xl:w-96 max-h-[32rem] bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 shrink-0 flex flex-col">
                    {/* Day tabs */}
                    <div className="flex items-center gap-1 mb-5">
                        <button
                            onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
                            className="text-zinc-500 hover:text-white transition p-1.5"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex justify-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
                            {dayTabs.map((day, i) => {
                                const isToday = day.toDateString() === today.toDateString();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDay(i)}
                                        className={`flex flex-col items-center px-3 py-2 rounded-lg text-sm font-semibold transition shrink-0 ${i === selectedDay
                                            ? 'bg-blue-600 text-white'
                                            : isToday
                                                ? 'bg-zinc-700 text-white'
                                                : 'text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                    >
                                        <span className="uppercase text-xs">
                                            {day.toLocaleDateString('en', { weekday: 'short' })}
                                        </span>
                                        <span className="text-base font-bold">{day.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setSelectedDay((d) => Math.min(dayTabs.length - 1, d + 1))}
                            className="text-zinc-500 hover:text-white transition p-1.5"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Time slots — capped height with styled scrollbar */}
                    <div className="flex-1 max-h-[32rem] overflow-y-auto space-y-1 pr-1"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                    >
                        {selectedDaySlots.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-8">No airings scheduled</p>
                        ) : selectedDaySlots.map((slot, i) => {
                            const time = new Date(slot.airingAt * 1000);
                            const timeStr = time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
                            const title = slot.media.title.english || slot.media.title.romaji;
                            return (
                                <button
                                    key={i}
                                    onClick={() => goToAnime(slot.media.id)}
                                    className="flex items-center gap-3 w-full hover:bg-zinc-800/60 rounded-lg px-3 py-2 transition text-left group"
                                >
                                    <span className="text-zinc-500 text-xs font-mono w-12 shrink-0">{timeStr}</span>
                                    <img src={slot.media.coverImage.medium} alt={title} className="w-9 h-12 object-cover rounded shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm truncate group-hover:text-blue-400 transition">{title}</p>
                                        <p className="text-zinc-500 text-xs mt-0.5">EP {slot.episode}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedDaySlots.length > 0 && (
                        <p className="text-zinc-600 text-xs mt-4 text-right">
                            {new Date().toLocaleString()} ·
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
