import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { academyApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
}

const PILLARS = [
  { name: 'Awareness', desc: 'You cannot heal what you cannot see' },
  { name: 'Understanding', desc: 'Healing requires context, not just compassion' },
  { name: 'Practice', desc: 'Transformation is built in small, daily repetitions' },
  { name: 'Legacy', desc: 'Your healing is not just for you — it echoes forward' },
];

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        const data = (await academyApi.listCourses()) as unknown as Course[];
        setCourses(data || []);
        setError(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load courses';
        setError(msg);
        console.error('Failed to load courses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      navigate('/login', { state: { redirect: '/academy' } });
      return;
    }

    try {
      await academyApi.enrollCourse(courseId);
      navigate('/academy/enrolled');
    } catch (err: any) {
      const msg = err?.message || 'Failed to enroll in course';
      alert(msg);
    }
  };

  return (
    <div>

      {/* Courses — Ivory */}
      <section style={{ backgroundColor: '#F5ECD7' }} className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 sm:px-10">
          <motion.div {...fade()} className="mb-4">
            <p
              className="uppercase tracking-[0.2em] mb-4"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '11px',
                color: '#C9A84C',
              }}
            >
              Available Courses
            </p>
            <p
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
                fontSize: '15px',
                lineHeight: 1.8,
              }}
            >
              Select a course to begin your healing journey. Each represents a complete pathway
              through the material.
            </p>
          </motion.div>

          {isLoading && (
            <motion.div
              {...fade(0.2)}
              className="text-center py-12"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
              }}
            >
              Loading courses...
            </motion.div>
          )}

          {error && (
            <motion.div
              {...fade(0.2)}
              className="px-6 py-4 text-sm mb-8"
              style={{
                backgroundColor: 'rgba(160, 82, 45, 0.15)',
                border: '1px solid #A0522D',
                color: '#704214',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {error}
            </motion.div>
          )}

          {!isLoading && courses.length === 0 && !error && (
            <motion.div
              {...fade(0.2)}
              className="text-center py-12"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
              }}
            >
              No courses available at this time. Please check back soon.
            </motion.div>
          )}

          {!isLoading && courses.length > 0 && (
            <div className="mt-8 space-y-2">
              {courses.map((course, idx) => {
                const isOpen = open === course.id;
                return (
                  <motion.div key={course.id} {...fade(idx * 0.05)}>
                    <div
                      style={{
                        border: '1px solid',
                        borderColor: isOpen ? '#C9A84C' : '#8B5E3C',
                        borderRadius: '3px',
                        backgroundColor: isOpen ? '#2C1810' : 'transparent',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : course.id)}
                        className="w-full text-left flex items-center gap-5 px-6 py-5"
                      >
                        <span
                          style={{
                            fontFamily: '"IBM Plex Mono", Menlo, monospace',
                            fontSize: '13px',
                            color: '#C9A84C',
                            flexShrink: 0,
                            width: '2.2rem',
                          }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: isOpen ? '#F5ECD7' : '#2C1810',
                            flex: 1,
                          }}
                        >
                          {course.title}
                        </span>
                        <span style={{ color: '#C9A84C', fontSize: '20px', flexShrink: 0 }}>
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div
                              className="px-6 pb-7"
                              style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}
                            >
                              <p
                                className="mt-5 mb-5"
                                style={{
                                  fontFamily: '"Libre Baskerville", Georgia, serif',
                                  color: '#2C1810',
                                  fontSize: '15px',
                                  lineHeight: 1.85,
                                }}
                              >
                                {course.description}
                              </p>

                              {course.modules && course.modules.length > 0 && (
                                <div className="mt-6 mb-6">
                                  <p
                                    style={{
                                      fontFamily: '"DM Sans", sans-serif',
                                      fontSize: '12px',
                                      color: '#704214',
                                      marginBottom: '0.75rem',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.12em',
                                    }}
                                  >
                                    Modules
                                  </p>
                                  <div className="grid gap-2">
                                    {course.modules.map((module) => (
                                      <div
                                        key={module.id}
                                        style={{
                                          padding: '10px 12px',
                                          backgroundColor: 'rgba(201,168,76,0.08)',
                                          border: '1px solid rgba(201,168,76,0.15)',
                                          borderRadius: '2px',
                                        }}
                                      >
                                        <p
                                          style={{
                                            fontFamily: '"Libre Baskerville", Georgia, serif',
                                            fontSize: '13px',
                                            color: '#2C1810',
                                            fontWeight: 600,
                                          }}
                                        >
                                          {module.title}
                                        </p>
                                        <p
                                          style={{
                                            fontFamily: '"Libre Baskerville", Georgia, serif',
                                            fontSize: '12px',
                                            color: '#704214',
                                            marginTop: '2px',
                                          }}
                                        >
                                          {module.lessonCount} lessons
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div
                                className="flex gap-3 pt-2"
                                style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}
                              >
                                <button
                                  onClick={() => handleEnroll(course.id)}
                                  className="flex-1 px-4 py-3 text-sm font-semibold transition-colors"
                                  style={{
                                    fontFamily: '"DM Sans", sans-serif',
                                    backgroundColor: '#C9A84C',
                                    color: '#2C1810',
                                    borderRadius: '2px',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#D9B857')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#C9A84C')
                                  }
                                >
                                  Enroll Now
                                </button>
                                <Link
                                  to={`/academy/courses/${course.id}`}
                                  className="flex-1 px-4 py-3 text-sm font-semibold transition-colors text-center"
                                  style={{
                                    fontFamily: '"DM Sans", sans-serif',
                                    backgroundColor: 'transparent',
                                    color: '#C9A84C',
                                    border: '1px solid #C9A84C',
                                    borderRadius: '2px',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#C9A84C';
                                    e.currentTarget.style.color = '#2C1810';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#C9A84C';
                                  }}
                                >
                                  View Details
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>


      {/* Four Pillars — Heritage Brown */}
      <section
        className="py-24 md:py-32"
        style={{
          backgroundColor: '#2C1810',
          background:
            'linear-gradient(135deg, #2C1810 0%, #3D2B1F 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div {...fade()} className="text-center mb-16">
            <p
              className="uppercase tracking-[0.2em] mb-4"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '11px',
                color: '#C9A84C',
              }}
            >
              Our Foundation
            </p>
            <h2
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                color: '#F5ECD7',
                fontWeight: 700,
              }}
            >
              Four Pillars of Healing
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.name}
                {...fade(i * 0.1)}
                style={{
                  padding: '32px',
                  border: '1px solid rgba(201,168,76,0.2)',
                  backgroundColor: 'rgba(44,24,16,0.5)',
                  borderRadius: '3px',
                }}
              >
                <p
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '11px',
                    color: '#C9A84C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    marginBottom: '12px',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#F5ECD7',
                    marginBottom: '12px',
                  }}
                >
                  {pillar.name}
                </h3>
                <p
                  style={{
                    fontFamily: '"Libre Baskerville", Georgia, serif',
                    fontSize: '15px',
                    color: '#E8DCBE',
                    lineHeight: 1.7,
                  }}
                >
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
