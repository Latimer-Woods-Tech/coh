import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export default function AudioPlayer({
  audioUrl,
  title = 'Lesson Audio',
  onTimeUpdate,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadingStart = () => setIsLoading(true);
    const handleLoadingEnd = () => setIsLoading(false);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleError = () => setError('Failed to load audio');
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('loadstart', handleLoadingStart);
    audio.addEventListener('canplay', handleLoadingEnd);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadstart', handleLoadingStart);
      audio.removeEventListener('canplay', handleLoadingEnd);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    if (!finite(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="p-6 rounded"
      style={{
        backgroundColor: '#2C1810',
        border: '1px solid #3D2B1F',
      }}
    >
      {/* Audio element (hidden) */}
      <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />

      {/* Title */}
      <h3
        className="text-lg font-bold mb-4"
        style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
      >
        🎙️ {title}
      </h3>

      {/* Error message */}
      {error && (
        <div
          className="px-3 py-2 rounded mb-4 text-sm"
          style={{
            backgroundColor: 'rgba(160, 82, 45, 0.15)',
            border: '1px solid #A0522D',
            color: '#E8DCBE',
          }}
        >
          {error}
        </div>
      )}

      {/* Play controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          disabled={isLoading || !!error}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
          style={{
            backgroundColor: '#C9A84C',
            color: '#2C1810',
            border: 'none',
            cursor: isLoading || error ? 'not-allowed' : 'pointer',
            fontSize: '1.5rem',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Time display */}
        <div className="text-sm font-mono" style={{ color: '#704214', minWidth: '80px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume control */}
        <div className="ml-auto flex items-center gap-2">
          <span style={{ color: '#704214', fontSize: '0.875rem' }}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20"
            style={{
              cursor: 'pointer',
            }}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full"
          style={{
            cursor: 'pointer',
            height: '6px',
            accentColor: '#C9A84C',
          }}
          aria-label="Seek"
        />
        <div
          className="h-1 rounded"
          style={{
            backgroundColor: '#3D2B1F',
            background: `linear-gradient(to right, #C9A84C ${progressPercent}%, #3D2B1F ${progressPercent}%)`,
          }}
        />
      </div>

      {/* Download button */}
      {audioUrl && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #3D2B1F' }}>
          <a
            href={audioUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors hover:opacity-80"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              backgroundColor: '#3D2B1F',
              color: '#C9A84C',
              border: '1px solid #3D2B1F',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            📥 Download Audio
          </a>
        </div>
      )}
    </div>
  );
}

// Helper to check if number is finite
function finite(n: number): boolean {
  return Number.isFinite(n);
}
