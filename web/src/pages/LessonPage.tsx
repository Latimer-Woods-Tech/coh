import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/auth';
import AudioPlayer from '../components/AudioPlayer';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  contentType: 'video' | 'text' | 'quiz' | 'audio';
  videoUrl: string | null;
  textContent: string | null;
  audioUrl?: string | null;
  audioTranscript?: string | null;
  durationMinutes: number | null;
  sortOrder: number;
  isFree: boolean;
  completed?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  modules: Module[];
}

const API = import.meta.env.VITE_API_URL ?? 'https://cypher-of-healing-api.workers.dev';

export default function LessonPage() {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseSlug || !token) return;
    try {
      const res = await fetch(`${API}/api/academy/courses/${courseSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load course');
      const data = await res.json();
      setCourse(data.course);

      // Set the current lesson from URL param, or default to first lesson
      const allLessons = data.course.modules.flatMap((m: Module) => m.lessons);
      const target = lessonId
        ? allLessons.find((l: Lesson) => l.id === lessonId)
        : allLessons[0];
      setCurrentLesson(target ?? null);
    } catch (err) {
      setError('Unable to load course content. Please try again.');
    }
  }, [courseSlug, lessonId, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCourse();
  }, [fetchCourse, token, navigate]);

  // Update current lesson when URL lessonId changes
  useEffect(() => {
    if (!course || !lessonId) return;
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const target = allLessons.find((l) => l.id === lessonId);
    if (target) setCurrentLesson(target);
  }, [lessonId, course]);

  const markComplete = async () => {
    if (!currentLesson || markingComplete) return;
    setMarkingComplete(true);
    try {
      await fetch(`${API}/api/academy/lessons/${currentLesson.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentLesson((prev) => (prev ? { ...prev, completed: true } : prev));

      // Navigate to next lesson
      const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
      const idx = allLessons.findIndex((l) => l.id === currentLesson.id);
      if (idx < allLessons.length - 1) {
        navigate(`/academy/${courseSlug}/${allLessons[idx + 1].id}`);
      }
    } finally {
      setMarkingComplete(false);
    }
  };

  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A0E09' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}>{error}</p>
          <Link to="/academy" className="underline" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>
            Back to Academy
          </Link>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A0E09' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A0E09' }}>
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 py-3 flex-shrink-0" style={{ backgroundColor: '#2C1810', borderBottom: '1px solid #3D2B1F' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 transition-colors"
          style={{ color: '#8B5E3C', background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Toggle sidebar"
          onMouseEnter={e => (e.currentTarget.style.color = '#F5ECD7')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8B5E3C')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/academy" className="text-sm font-medium transition-colors" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>
          ← The Academy
        </Link>
        <span className="text-sm hidden md:block" style={{ color: '#3D2B1F' }}>/ {course.title}</span>
        <h1 className="text-sm font-semibold ml-2 truncate" style={{ fontFamily: '"Playfair Display", serif', color: '#E8DCBE' }}>{currentLesson.title}</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs hidden md:block" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>
            {currentIndex + 1} of {allLessons.length}
          </span>
          {currentLesson.completed ? (
            <span className="px-3 py-1 text-xs font-semibold" style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#1A3A3A', color: '#C9A84C', border: '1px solid #1A3A3A' }}>
              ✓ Completed
            </span>
          ) : (
            <button
              onClick={markComplete}
              disabled={markingComplete}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}
            >
              {markingComplete ? 'Saving…' : 'Mark Complete'}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-y-auto flex-shrink-0"
              style={{ backgroundColor: '#2C1810', borderRight: '1px solid #3D2B1F' }}
            >
              <div className="p-5" style={{ minWidth: '300px' }}>
                <h2 className="font-bold text-base mb-5" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>{course.title}</h2>
                {course.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="mb-6">
                    <div className="text-xs uppercase tracking-widest font-bold mb-2 px-2" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#C9A84C', letterSpacing: '0.15em' }}>
                      Station {mIdx + 1}: {mod.title}
                    </div>
                    <div className="space-y-0.5">
                      {mod.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/academy/${courseSlug}/${lesson.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                          style={{
                            fontFamily: '"Libre Baskerville", serif',
                            backgroundColor: lesson.id === currentLesson.id ? '#3D2B1F' : 'transparent',
                            borderLeft: lesson.id === currentLesson.id ? '3px solid #C9A84C' : '3px solid transparent',
                            color: lesson.id === currentLesson.id ? '#F5ECD7' : '#8B5E3C',
                            textDecoration: 'none',
                          }}
                        >
                          <span className="flex-shrink-0" style={{ color: lesson.completed ? '#C9A84C' : '#704214', fontSize: '0.7rem' }}>
                            {lesson.completed ? '✓' : lesson.contentType === 'video' ? '▶' : '◈'}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                          {lesson.durationMinutes && (
                            <span className="text-xs ml-auto flex-shrink-0" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214', opacity: 0.6 }}>
                              {lesson.durationMinutes}m
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#1A0E09' }}>
          <div className="max-w-4xl mx-auto p-6 md:p-10">

            {/* Video Player */}
            {currentLesson.contentType === 'video' && currentLesson.videoUrl && (
              <div className="aspect-video overflow-hidden mb-8" style={{ backgroundColor: '#000', border: '1px solid #3D2B1F' }}>
                <iframe
                  src={currentLesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentLesson.title}
                />
              </div>
            )}

            {currentLesson.contentType === 'video' && !currentLesson.videoUrl && (
              <div className="aspect-video flex items-center justify-center mb-8" style={{ backgroundColor: '#2C1810', border: '1px solid #3D2B1F' }}>
                <div className="text-center">
                  <div className="text-5xl mb-3" style={{ color: '#704214' }}>▶</div>
                  <p className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: '#8B5E3C' }}>Video content coming soon</p>
                </div>
              </div>
            )}

            {/* Lesson header */}
            <motion.div key={currentLesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs uppercase tracking-widest font-bold" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#C9A84C', letterSpacing: '0.15em' }}>
                  {currentLesson.contentType}
                </span>
                {currentLesson.durationMinutes && (
                  <span className="text-xs" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>· {currentLesson.durationMinutes} min</span>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>
                {currentLesson.title}
              </h2>
              {currentLesson.description && (
                <p className="text-lg leading-relaxed mb-8" style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}>
                  {currentLesson.description}
                </p>
              )}

              {/* Text content */}
              {currentLesson.contentType === 'text' && currentLesson.textContent && (
                <div
                  className="prose-lg max-w-none leading-relaxed"
                  style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE', lineHeight: 1.85 }}
                  dangerouslySetInnerHTML={{ __html: currentLesson.textContent }}
                />
              )}

              {/* Audio content */}
              {currentLesson.contentType === 'audio' && currentLesson.audioUrl && (
                <div className="mb-8">
                  <AudioPlayer
                    audioUrl={currentLesson.audioUrl}
                    title={currentLesson.title}
                    onTimeUpdate={() => {
                      // Could save progress here
                    }}
                  />
                </div>
              )}

              {/* Audio transcript */}
              {currentLesson.contentType === 'audio' && currentLesson.audioTranscript && (
                <div
                  className="mt-8 p-6 rounded"
                  style={{
                    backgroundColor: '#2C1810',
                    border: '1px solid #3D2B1F',
                  }}
                >
                  <h3
                    className="text-base font-bold mb-4"
                    style={{ fontFamily: '"Playfair Display", serif', color: '#C9A84C' }}
                  >
                    📝 Transcript
                  </h3>
                  <div
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE', lineHeight: 1.7 }}
                  >
                    {currentLesson.audioTranscript}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12 pt-8" style={{ borderTop: '1px solid #3D2B1F' }}>
              {prevLesson ? (
                <Link
                  to={`/academy/${courseSlug}/${prevLesson.id}`}
                  className="flex items-center gap-2 text-sm group transition-colors"
                  style={{ color: '#8B5E3C', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span className="truncate max-w-[200px]">{prevLesson.title}</span>
                </Link>
              ) : (
                <div />
              )}

              {!currentLesson.completed && (
                <button
                  onClick={markComplete}
                  disabled={markingComplete}
                  className="px-6 py-2.5 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
                >
                  {markingComplete ? 'Saving…' : nextLesson ? 'Complete & Continue →' : 'Complete Course ✓'}
                </button>
              )}

              {nextLesson ? (
                <Link
                  to={`/academy/${courseSlug}/${nextLesson.id}`}
                  className="flex items-center gap-2 text-sm group transition-colors"
                  style={{ color: '#8B5E3C', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}
                >
                  <span className="truncate max-w-[200px]">{nextLesson.title}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
