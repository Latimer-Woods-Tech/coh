import { useState, useEffect } from 'react';
import { academyApi } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  modules?: Array<{
    id: string;
    title: string;
    lessons?: Array<{
      id: string;
      title: string;
      contentType: string;
      audioUrl?: string;
    }>;
  }>;
}

export default function AdminCoursesPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const data = (await academyApi.listCourses()) as unknown as Course[];
      setCourses(data || []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load courses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAudioForLesson = async (lessonId: string) => {
    try {
      setGeneratingAudio(lessonId);
      await academyApi.generateAudio(lessonId);
      // Reload courses to reflect changes
      await loadCourses();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate audio';
      setError(msg);
    } finally {
      setGeneratingAudio(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#C9A84C' }}
          />
          <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="px-6 py-4 rounded"
        style={{
          backgroundColor: 'rgba(160, 82, 45, 0.15)',
          border: '1px solid #A0522D',
          color: '#E8DCBE',
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Manage Courses
        </h2>
        <button
          className="px-4 py-2 rounded font-medium text-sm"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            backgroundColor: '#C9A84C',
            color: '#2C1810',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div
          className="py-12 text-center rounded"
          style={{ backgroundColor: '#2C1810', border: '1px solid #3D2B1F' }}
        >
          <p style={{ color: '#704214', fontFamily: '"Libre Baskerville", serif' }}>
            No courses found. Create your first course to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-6 rounded"
              style={{
                backgroundColor: '#2C1810',
                border: '1px solid #3D2B1F',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
                  >
                    {course.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#8B5E3C', fontFamily: 'DM Sans, sans-serif' }}>
                    Slug: <code style={{ color: '#C9A84C' }}>{course.slug}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      backgroundColor: '#3D2B1F',
                      color: '#C9A84C',
                      border: '1px solid #3D2B1F',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      backgroundColor: '#3D2B1F',
                      color: '#A0522D',
                      border: '1px solid #3D2B1F',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {course.modules && course.modules.length > 0 && (
                <div className="mt-4">
                  <h4
                    className="text-sm font-bold mb-3"
                    style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.08em' }}
                  >
                    MODULES & LESSONS
                  </h4>
                  <div className="space-y-2">
                    {course.modules.map((module) => (
                      <div key={module.id}>
                        <p className="text-sm font-medium mb-2" style={{ color: '#E8DCBE', fontFamily: '"Libre Baskerville", serif' }}>
                          {module.title}
                        </p>
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center justify-between text-xs">
                                <span style={{ color: '#8B5E3C', fontFamily: 'DM Sans, sans-serif' }}>
                                  {lesson.title}{' '}
                                  <span style={{ color: '#704214' }}>({lesson.contentType})</span>
                                </span>
                                {lesson.contentType === 'audio' && lesson.audioUrl ? (
                                  <span style={{ color: '#1A3A3A', backgroundColor: '#C9A84C', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                    ✓ AUDIO READY
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => generateAudioForLesson(lesson.id)}
                                    disabled={generatingAudio === lesson.id}
                                    className="px-2 py-0.5"
                                    style={{
                                      fontFamily: 'DM Sans, sans-serif',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      backgroundColor: '#3D2B1F',
                                      color: '#C9A84C',
                                      border: '1px solid #3D2B1F',
                                      cursor: generatingAudio === lesson.id ? 'not-allowed' : 'pointer',
                                      opacity: generatingAudio === lesson.id ? 0.5 : 1,
                                    }}
                                  >
                                    {generatingAudio === lesson.id ? '⏳' : '🎙️ GEN'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
