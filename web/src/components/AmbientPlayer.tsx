// AmbientPlayer — CypherOfHealing Healing Jazz
// Playlist: Kevin MacLeod (incompetech.com)
// License: Creative Commons Attribution 4.0 — http://creativecommons.org/licenses/by/4.0/
// For production: replace src values with tracks hosted on Cloudflare R2
// and licensed for commercial use (Musicbed, Artlist, or commissioned originals).

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  title: string;
  year: string;
  src: string;
}

const PLAYLIST: Track[] = [
  {
    title: 'Smoky Situation',
    year: "'55",
    src: 'https://incompetech.filmmusic.io/song/5709-smoky-situation/mp3',
  },
  {
    title: 'Investigations',
    year: "'48",
    src: 'https://incompetech.filmmusic.io/song/4062-investigations/mp3',
  },
  {
    title: 'Sneaky Snitch',
    year: "'51",
    src: 'https://incompetech.filmmusic.io/song/3724-sneaky-snitch/mp3',
  },
  {
    title: 'Take a Chance',
    year: "'46",
    src: 'https://incompetech.filmmusic.io/song/4588-take-a-chance/mp3',
  },
];

export default function AmbientPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const track = PLAYLIST[trackIdx];

  // — Advance to next track
  const nextTrack = useCallback(() => {
    setTrackIdx((p) => (p + 1) % PLAYLIST.length);
    setProgress(0);
  }, []);

  const prevTrack = useCallback(() => {
    setTrackIdx((p) => (p - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
  }, []);

  // — Wire up audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (audio.duration)
        setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', nextTrack);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', nextTrack);
    };
  }, [nextTrack]);

  // — Reload + autoplay when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
  }, [trackIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // — Sync mute state + set initial volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = 0.55;
    }
  }, [isMuted]);

  // — Drive vinyl spin CSS class
  useEffect(() => {
    setIsSpinning(isPlaying && !isMuted);
  }, [isPlaying, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none">
        <source src={track.src} type="audio/mpeg" />
      </audio>

      {/* Floating container — bottom left */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ backgroundColor: '#2C1810', borderColor: '#C9A84C' }}
              className="w-72 rounded-2xl border overflow-hidden shadow-2xl"
            >
              {/* Header bar */}
              <div
                style={{ backgroundColor: '#1A0E09', borderBottomColor: '#704214' }}
                className="flex items-center justify-between px-4 py-2 border-b"
              >
                <span
                  style={{ color: '#C9A84C', fontFamily: '"DM Sans", sans-serif' }}
                  className="text-xs font-bold uppercase tracking-[0.15em]"
                >
                  The Vinyl Room
                </span>
                <button
                  onClick={() => setIsDismissed(true)}
                  style={{ color: '#8B5E3C' }}
                  className="text-lg leading-none hover:opacity-70 transition-opacity"
                  aria-label="Dismiss player"
                >
                  ×
                </button>
              </div>

              {/* Vinyl + track info */}
              <div className="flex items-center gap-4 px-5 py-5">
                {/* Animated vinyl disc */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isSpinning ? 'animate-spin' : ''
                    }`}
                    style={{
                      background:
                        'conic-gradient(#1A0E09 0deg, #2C1810 60deg, #1A0E09 120deg, #2C1810 180deg, #1A0E09 240deg, #2C1810 300deg, #1A0E09 360deg)',
                      border: '2px solid #704214',
                      animationDuration: '3s',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: '#C9A84C' }}
                    />
                  </div>
                  {/* Grooves */}
                  <div
                    className="absolute inset-0 rounded-full opacity-20"
                    style={{
                      background:
                        'repeating-radial-gradient(circle, transparent 0px, transparent 3px, #C9A84C 3px, #C9A84C 3.5px)',
                    }}
                  />
                </div>

                {/* Track text */}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold truncate leading-tight"
                    style={{
                      color: '#F5ECD7',
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '15px',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    className="text-xs mt-0.5 tracking-wide"
                    style={{
                      color: '#8B5E3C',
                      fontFamily: '"DM Sans", sans-serif',
                    }}
                  >
                    Harlem, c. {track.year}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: '#704214', fontFamily: '"DM Sans", sans-serif' }}
                  >
                    {trackIdx + 1} / {PLAYLIST.length}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="mx-5 mb-4 h-1 rounded-full cursor-pointer overflow-hidden"
                style={{ backgroundColor: '#3D2B1F' }}
                onClick={seek}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#C9A84C', width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-5 pb-5">
                {/* Prev */}
                <button
                  onClick={prevTrack}
                  style={{ color: '#8B5E3C' }}
                  className="hover:opacity-70 transition-opacity p-1"
                  aria-label="Previous track"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                  </svg>
                </button>

                {/* Play / Pause */}
                <motion.button
                  onClick={togglePlay}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#C9A84C' }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#2C1810">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#2C1810">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </motion.button>

                {/* Next */}
                <button
                  onClick={nextTrack}
                  style={{ color: '#8B5E3C' }}
                  className="hover:opacity-70 transition-opacity p-1"
                  aria-label="Next track"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" />
                  </svg>
                </button>

                {/* Mute */}
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  style={{ color: isMuted ? '#704214' : '#8B5E3C' }}
                  className="hover:opacity-70 transition-opacity p-1"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l2 2L21 18.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Attribution */}
              <div
                className="px-5 pb-3 text-center"
                style={{
                  color: '#4A2C0E',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '9px',
                  letterSpacing: '0.05em',
                }}
              >
                Music: Kevin MacLeod · incompetech.com · CC BY 4.0
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle pill button */}
        <motion.button
          onClick={() => setIsOpen((o) => !o)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full shadow-xl border"
          style={{
            backgroundColor: '#2C1810',
            borderColor: '#C9A84C',
            color: '#C9A84C',
          }}
          aria-label="Toggle ambient jazz player"
        >
          {/* Animated bars when playing */}
          <div className="flex items-end gap-[2px] h-4">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full"
                style={{ backgroundColor: '#C9A84C' }}
                animate={
                  isPlaying && !isMuted
                    ? { height: ['4px', '14px', '6px', '14px', '4px'] }
                    : { height: '4px' }
                }
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.08em',
            }}
          >
            {isOpen ? 'CLOSE' : 'JAZZ'}
          </span>
        </motion.button>
      </div>
    </>
  );
}
