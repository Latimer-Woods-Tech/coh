import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { Volume2, Play, CheckCircle } from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

interface Lesson {
  id: string;
  stationNum: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'quiz';
  videoUrl?: string;
  audioNarrationUrl?: string;
  audioNarrationDurationSeconds?: number;
  hasTranscript?: boolean;
  hasVisualElements?: boolean;
  completed?: boolean;
  watchTimeSeconds?: number;
  durationMinutes?: number;
}

interface LessonViewerProps {
  lesson: Lesson;
  onComplete?: () => void;
  autoPlayAudio?: boolean;
}

export default function LessonViewer({ lesson, onComplete, autoPlayAudio = false }: LessonViewerProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(autoPlayAudio);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasAudio = !!lesson.audioNarrationUrl;
  const hasVideo = lesson.contentType === 'video' && !!lesson.videoUrl;

  const handleAudioPlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>
      {/* Header */}
      <section style={{ backgroundColor: '#2C1810' }} className="py-8 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#C9A84C' }}
            >
              Station {lesson.stationNum}
            </p>
            <h1
              className="text-2xl md:text-3xl font-bold mt-2"
              style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
            >
              {lesson.title}
            </h1>
          </div>
          {lesson.completed && (
            <div className="flex items-center gap-2" style={{ color: '#C9A84C' }}>
              <CheckCircle size={24} />
              <span className="text-xs uppercase tracking-wide">Completed</span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Video Section (if available) */}
        {hasVideo && (
          <motion.div {...fade()} className="mb-12">
            <div
              className="relative w-full rounded overflow-hidden"
              style={{
                backgroundColor: '#2C1810',
                aspectRatio: '16 / 9',
                border: '1px solid #8B5E3C',
              }}
            >
              <iframe
                src={lesson.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p
              className="text-xs mt-3 px-1"
              style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}
            >
              {lesson.durationMinutes} minute{lesson.durationMinutes !== 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {/* Description */}
        <motion.div {...fade(0.1)} className="mb-10">
          <p
            style={{
              fontFamily: '"Libre Baskerville", serif',
              color: '#2C1810',
              fontSize: '16px',
              lineHeight: 1.85,
            }}
          >
            {lesson.description}
          </p>
        </motion.div>

        {/* Audio Section */}
        {hasAudio && (
          <motion.div
            {...fade(0.2)}
            className="mb-12 p-6 rounded"
            style={{
              backgroundColor: '#E8DCBE',
              border: '1px solid #8B5E3C',
              borderLeft: '5px solid #C9A84C',
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <Volume2 size={24} style={{ color: '#C9A84C' }} />
              <div>
                <h3
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    color: '#2C1810',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  Narrated Audio
                </h3>
                <p
                  className="text-xs"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    color: '#704214',
                    marginTop: '2px',
                  }}
                >
                  {lesson.audioNarrationDurationSeconds
                    ? Math.floor(lesson.audioNarrationDurationSeconds / 60) +
                      ':' +
                      String(lesson.audioNarrationDurationSeconds % 60).padStart(2, '0')
                    : 'Duration unknown'}
                </p>
              </div>
            </div>

            {/* Audio Player Controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={isPlayingAudio ? handleAudioPause : handleAudioPlay}
                className="px-4 py-2 rounded flex items-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  backgroundColor: '#C9A84C',
                  color: '#2C1810',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                <Play size={16} />
                {isPlayingAudio ? 'Pause' : 'Play'}
              </button>

              {/* Progress bar */}
              <div className="flex-1 h-2 rounded" style={{ backgroundColor: '#D4C4A8' }}>
                <div
                  className="h-full rounded transition-all"
                  style={{
                    backgroundColor: '#C9A84C',
                    width: `${audioProgress}%`,
                  }}
                />
              </div>

              {/* Transcript toggle */}
              {lesson.hasTranscript && (
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="px-3 py-2 text-xs rounded uppercase tracking-wide transition-opacity hover:opacity-80"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    backgroundColor: showTranscript ? '#704214' : 'transparent',
                    color: showTranscript ? '#F5ECD7' : '#704214',
                    border: '1px solid #704214',
                  }}
                >
                  Transcript
                </button>
              )}
            </div>

            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={lesson.audioNarrationUrl}
              onPlay={() => setIsPlayingAudio(true)}
              onPause={() => setIsPlayingAudio(false)}
              onTimeUpdate={(e) => {
                const current = e.currentTarget.currentTime;
                const duration = e.currentTarget.duration;
                setAudioProgress((current / duration) * 100);
              }}
            />
          </motion.div>
        )}

        {/* Transcript (if available and shown) */}
        <AnimatePresence>
          {showTranscript && lesson.hasTranscript && (
            <motion.div
              {...fade(0.3)}
              className="mb-12 p-6 rounded"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D4C4A8',
              }}
            >
              <h4
                style={{
                  fontFamily: '"Playfair Display", serif',
                  color: '#2C1810',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                Transcript
              </h4>
              <p
                style={{
                  fontFamily: '"Libre Baskerville", serif',
                  color: '#3D2B1F',
                  fontSize: '14px',
                  lineHeight: 1.8,
                }}
              >
                [Transcript would load here from API]
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Elements Indicator */}
        {lesson.hasVisualElements && (
          <motion.div {...fade(0.3)} className="mb-8 p-4 rounded" style={{ backgroundColor: '#C9A84C20' }}>
            <p
              className="text-xs flex items-center gap-2"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#704214',
              }}
            >
              ✨ This lesson includes interactive visuals and guided exercises
            </p>
          </motion.div>
        )}

        {/* Call to Action */}
        {!lesson.completed && (
          <motion.div {...fade(0.4)} className="mt-12">
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 rounded uppercase tracking-wide text-sm font-bold transition-opacity hover:opacity-80"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                backgroundColor: '#C9A84C',
                color: '#2C1810',
              }}
            >
              Mark as Complete
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
