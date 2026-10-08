import React from 'react';

const links = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies' },
    { label: 'Series', href: '/series' },
    { label: 'Anime', href: '/anime' },
    { label: 'My List', href: '/myList' },
    { label: 'Cinema Room', href: '/cinema-room' },
];

const Footer: React.FC = () => {
    return (
        <footer className="w-full px-4 md:px-4 pb-4 pt-8">
            <div className="relative overflow-hidden rounded-2xl border border-blue-700/20 bg-zinc-600/10 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                {/* Top highlight line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="px-6 md:px-10 py-6">
                    {/* Top row: logo + links */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        {/* Logo */}
                        <a href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center transition-colors group-hover:bg-white/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-white"
                                >
                                    <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
                                    <path d="m6.2 5.3 3.1 3.9" />
                                    <path d="m12.4 3.4 3.1 4" />
                                    <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                                </svg>
                            </div>
                            <span className="text-white font-semibold text-base tracking-tight">
                                StreamBox
                            </span>
                        </a>

                        {/* Navigation links */}
                        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-400">
                            {links.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="transition-colors hover:text-white"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Divider */}
                    <div className="my-6 h-px w-full bg-white/10" />

                    {/* Bottom row: disclaimer + credit */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xl">
                            StreamBox doesn't host any files — all content comes from
                            third-party providers.
                        </p>

                        <p className="text-zinc-500 text-[11px]">
                            © {new Date().getFullYear()} StreamBox ·
                            Developed by{' '}
                            <span className="text-zinc-300 font-medium">Isam</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;