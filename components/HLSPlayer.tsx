/**
 * HLSPlayer.tsx — Production HLS player (Video.js UI + hls.js engine)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import Hls, { ErrorData, Events, Level } from 'hls.js';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

export interface HLSPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    onReady?: (player: Player) => void;
    onPlay?: () => void;
    onPause?: () => void;
    onBuffering?: () => void;
    onBufferingEnd?: () => void;
    onFatalError?: (err: ErrorData) => void;
    onLevelsReady?: (levels: Level[]) => void;
    className?: string;
}

const log = {
    info: (...a: unknown[]) => console.info('[HLSPlayer]', ...a),
    warn: (...a: unknown[]) => console.warn('[HLSPlayer]', ...a),
    error: (...a: unknown[]) => console.error('[HLSPlayer]', ...a),
};

const HLSPlayer: React.FC<HLSPlayerProps> = ({
    src,
    poster,
    autoPlay = false,
    onReady,
    onPlay,
    onPause,
    onBuffering,
    onBufferingEnd,
    onFatalError,
    onLevelsReady,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    // Track whether we've already attempted recoverMediaError once
    const mediaRecoveredRef = useRef(false);

    const teardown = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
            log.info('hls.js destroyed');
        }
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
            log.info('Video.js disposed');
        }
        mediaRecoveredRef.current = false;
    }, []);

    const initPlayer = useCallback((source: string) => {
        if (!containerRef.current) return;

        // Fresh <video> element each time — avoids "already initialised" errors
        const videoEl = document.createElement('video');
        videoEl.className = 'video-js vjs-big-play-centered';
        videoEl.setAttribute('playsinline', '');
        containerRef.current.appendChild(videoEl);

        // ── Video.js (UI only) ──────────────────────────────────────────────
        const player = videojs(videoEl, {
            controls: true,
            responsive: true,
            fluid: true,
            preload: 'auto',
            poster: poster ?? '',
            // Do NOT pass autoplay here — we call player.play() after manifest
            // is parsed so the browser doesn't abort the load mid-init.
            autoplay: false,
            html5: {
                vhs: { overrideNative: false },
                nativeVideoTracks: false,
                nativeAudioTracks: false,
                nativeTextTracks: false,
            },
        });

        playerRef.current = player;

        player.on('play', () => { log.info('▶ play'); onPlay?.(); });
        player.on('pause', () => { log.info('⏸ pause'); onPause?.(); });
        player.on('waiting', () => { log.info('⏳ buffering'); onBuffering?.(); });
        player.on('canplay', () => { log.info('✅ canplay'); onBufferingEnd?.(); });

        // ── hls.js (playback engine) ────────────────────────────────────────
        if (Hls.isSupported()) {
            log.info('hls.js supported — initialising');

            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
                xhrSetup: (xhr, _url) => {
                    // Extend here for auth headers, Referer, etc.
                },
            });

            hlsRef.current = hls;

            // Attach to the raw <video> element, not the Video.js wrapper
            const mediaEl = player.el().querySelector('video') as HTMLVideoElement;
            hls.attachMedia(mediaEl);

            hls.on(Events.MEDIA_ATTACHED, () => {
                log.info('Media attached — loading:', source);
                hls.loadSource(source);
            });

            hls.on(Events.MANIFEST_PARSED, (_e, data) => {
                log.info(`Manifest parsed — ${data.levels.length} level(s)`);
                onLevelsReady?.(data.levels);
                if (autoPlay) {
                    // Small delay lets MSE finish codec negotiation before play()
                    setTimeout(() => {
                        player.play()?.catch((e) => log.warn('Autoplay blocked:', e));
                    }, 100);
                }
            });

            hls.on(Events.LEVEL_SWITCHED, (_e, data) => {
                log.info(`Level switched → ${data.level}`);
            });

            hls.on(Events.FRAG_BUFFERED, () => onBufferingEnd?.());

            // ── Error handling ──────────────────────────────────────────────
            hls.on(Events.ERROR, (_e, data) => {
                const { type, details, fatal } = data;
                log.warn(`hls.js [${type}] ${details} fatal=${fatal}`);

                if (!fatal) return;

                if (type === Hls.ErrorTypes.NETWORK_ERROR) {
                    log.warn('Network error — startLoad()');
                    hls.startLoad();
                    return;
                }

                if (type === Hls.ErrorTypes.MEDIA_ERROR) {
                    if (!mediaRecoveredRef.current) {
                        // First media error: standard recovery
                        log.warn('Media error — recoverMediaError() attempt 1');
                        mediaRecoveredRef.current = true;
                        hls.recoverMediaError();
                        return;
                    }

                    // Second media error after recovery attempt:
                    // bufferAddCodecError / bufferAppendError loop — do a full source reload
                    log.warn('Media error after recovery — reloading source');
                    mediaRecoveredRef.current = false;
                    hls.detachMedia();
                    hls.attachMedia(mediaEl);
                    // MEDIA_ATTACHED will fire again and call loadSource
                    hls.once(Events.MEDIA_ATTACHED, () => {
                        hls.loadSource(source);
                    });
                    return;
                }

                // Truly unrecoverable
                log.error('Unrecoverable error — destroying');
                hls.destroy();
                hlsRef.current = null;
                onFatalError?.(data);
            });

        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            log.info('Native HLS (Safari)');
            videoEl.src = source;
            if (autoPlay) {
                player.play()?.catch((e) => log.warn('Autoplay blocked:', e));
            }
        } else {
            log.error('HLS not supported in this browser');
            onFatalError?.({ fatal: true, details: 'HLS not supported' } as unknown as ErrorData);
        }

        player.ready(() => {
            log.info('Video.js ready');
            onReady?.(player);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poster, autoPlay]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        teardown();
        initPlayer(src);
        return () => { teardown(); };
    }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            data-vjs-player
            ref={containerRef}
            className={`w-full ${className}`}
        />
    );
};

export default HLSPlayer;
