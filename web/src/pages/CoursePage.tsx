import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/auth';

interface Lesson {
  id: string;
  title: string;
  contentType: 'video' | 'text' | 'quiz';
  durationMinutes: number | null;
  isFree: boolean;
  sortOrder: number;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  dripDelayDays: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: string;
  totalModules: number;
  totalLessons: number;
  estimatedHours: string | null;
  isPublished: boolean;
  modules: Module[];
  enrolled?: boolean;
}

const API = import.meta.env.VITE_API_URL ?? 'https://cypher-of-healing-api.workers.dev';

const pricingTiers = [
  {
    name: 'The Cipher',
    price: '$197',
    description: 'Full course access, self-paced for life',
    features: [
      'All 6 stations of content',
      'Downloadable workbooks & exercises',
      'Lifetime access',
      'Certificate of completion',
    ],
    cta: 'Enroll Now',
    highlighted: false,
  },
  {
    name: 'The Cipher + Coaching',
    price: '$297',
    description: 'Course + 1 private integration session',
    features: [
      'Everything in The Cipher',
      '1 private coaching session (60 min)',
      'Personalized integration plan',
      'Priority email support',
      'Access to community forums',
    ],
    cta: 'Enroll + Book Session',
    highlighted: true,
  },
  {
    name: 'The Full Immersion',
    price: '$497',
    description: 'Deep-dive with ongoing support',
    features: [
      'Everything in Cipher + Coaching',
      '3 private coaching sessions',
      'Weekly group accountability call',
      'Custom resilience blueprint',
      'Inner Circle community access',
    ],
    cta: 'Apply for Immersion',
    highlighted: false,
  },
];

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!slug) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/api/academy/courses/${slug}`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourse(data.course);
      // Expand first module by default
      if (data.course.modules?.length > 0) {
        setExpandedModule(data.course.modules[0].id);
      }
    } catch {
      // Course not found or API error — show fallback content
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleEnroll = async (tier: typeof pricingTiers[0]) => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (tier.name === 'The Full Immersion') {
      navigate('/booking');
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      const res = await fetch(`${API}/api/academy/courses/${course.slug}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.checkoutUrl && data.checkoutUrl !== 'TODO_STRIPE_CHECKOUT_URL') {
        window.location.href = data.checkoutUrl;
      } else {
        // Enrolled (dev/free) — go to first lesson
        const firstLesson = course.modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          navigate(`/academy/${course.slug}/${firstLesson.id}`);
        } else {
          navigate('/academy');
        }
      }
    } catch {
      // Enrollment error
    } finally {
      setEnrolling(false);
    }
  };

  const totalMinutes =
    course?.modules
      .flatMap((m) => m.lessons)
      .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0) ?? 0;

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5ECD7' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Use fallback data if API unavailable (static course data)
  const displayTitle = course?.title ?? 'The Cipher of Healing';
  const displayDescription =
    course?.description ??
    'A 6-station guided journey that decodes the language of your wounds, inhabits the zero of the present, and restores the future you were always meant to live.';
  const displayModules = course?.modules ?? [];
  const displayPrice = course?.price ? `$${course.price}` : '$197';
  const totalLessons = course?.totalLessons ?? displayModules.flatMap((m) => m.lessons).length;

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: '#2C1810' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.04 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="course-circles" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
                <circle cx="70" cy="70" r="66" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
                <circle cx="70" cy="70" r="48" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                <circle cx="70" cy="70" r="30" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#course-circles)" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="uppercase text-xs tracking-widest mb-5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}>
                The Academy — Signature Course
              </p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>
                {displayTitle}
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}>
                {displayDescription}
              </p>

              {/* Meta stats */}
              <div className="flex flex-wrap gap-6 text-sm mb-10">
                {[
                  `${course?.totalModules ?? 6} Stations`,
                  `${totalLessons} Lessons`,
                  totalMinutes > 0 ? `${Math.round(totalMinutes / 60)}+ hrs` : '12–18 hrs',
                  'Self-paced',
                ].map((stat) => (
                  <span key={stat} className="flex items-center gap-2" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}>
                    <span style={{ color: '#C9A84C' }}>◈</span> {stat}
                  </span>
                ))}
              </div>

              {course?.enrolled ? (
                <Link
                  to={`/academy/${course.slug}/${course.modules?.[0]?.lessons?.[0]?.id}`}
                  className="inline-block px-10 py-4 uppercase tracking-widest text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', letterSpacing: '0.12em' }}
                >
                  Continue Learning →
                </Link>
              ) : (
                <a
                  href="#pricing"
                  className="inline-block px-10 py-4 uppercase tracking-widest text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', letterSpacing: '0.12em' }}
                >
                  Enroll — Starting at {displayPrice}
                </a>
              )}
            </motion.div>

            {/* Course info card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8"
              style={{ backgroundColor: '#1A0E09', border: '1px solid #704214' }}
            >
              <blockquote className="text-xl font-bold italic leading-relaxed mb-8" style={{ fontFamily: '"Playfair Display", serif', color: '#E8DCBE' }}>
                "A cipher is code. A zero. A circle. This course gives you both the key and the courage to use it."
              </blockquote>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Format', value: 'Video + Workbook' },
                  { label: 'Access', value: 'Lifetime' },
                  { label: 'Level', value: 'All levels' },
                  { label: 'Certificate', value: 'Yes, upon completion' },
                ].map((item) => (
                  <div key={item.label} className="p-4" style={{ backgroundColor: '#2C1810', border: '1px solid #3D2B1F' }}>
                    <div className="text-xs uppercase tracking-wide mb-1" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>{item.label}</div>
                    <div className="font-semibold text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: '#E8DCBE' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You Will Decode */}
      <section className="py-20 px-6" style={{ backgroundColor: '#F5ECD7' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-14"
          >
            <p className="uppercase text-xs tracking-widest mb-4" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', letterSpacing: '0.2em' }}>
              The curriculum
            </p>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}>
              What You Will Decode
            </h2>
            <p className="text-lg max-w-2xl" style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F' }}>
              Six stations of deliberate, sequenced restoration — because healing is not random, it is structured.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              { num: '01', title: 'The Cipher Framework', desc: 'Set your intention. Learn what the cipher means — as code, as zero, as circle. Make the commitment to honesty.' },
              { num: '02', title: 'Roots of the Past', desc: 'Map your wounds without re-living them. Childhood patterns, family roles, attachment styles — the code you inherited.' },
              { num: '03', title: 'Breaking the Code', desc: 'Recognize trauma responses in daily life. Name the triggers. Close the gap between stimulus and choice.' },
              { num: '04', title: 'Healing in Motion', desc: 'Mind-body reset. Cognitive reframing. Rewriting beliefs that were never yours to begin with.' },
              { num: '05', title: 'Rebuilding Resilience', desc: 'Daily habits that compound. Boundaries as love. The 30-day tracker that keeps the fresh cut clean.' },
              { num: '06', title: 'The Cipher of the Future', desc: 'Visualize the healed self. Write your Legacy Letter. Declare what you pass forward — and what ends with you.' },
            ].map((s) => (
              <motion.div
                key={s.num} variants={itemVariants}
                className="p-7 transition-colors"
                style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}
              >
                <div className="mb-4">
                  <span className="text-xs font-bold" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#C9A84C', letterSpacing: '0.15em' }}>
                    STATION {s.num}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}>{s.title}</h3>
                <p className="leading-relaxed text-sm" style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F' }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live curriculum accordion */}
      {displayModules.length > 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: '#E8DCBE' }}>
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
              <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}>Full Curriculum</h2>
              <p className="text-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}>
                {displayModules.length} stations · {totalLessons} lessons ·{' '}
                {totalMinutes > 0 ? `${Math.round(totalMinutes / 60)}+ hours` : '12–18 hours'} of content
              </p>
            </motion.div>

            <div className="space-y-2">
              {displayModules.map((mod, idx) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }} viewport={{ once: true }}
                  style={{ border: expandedModule === mod.id ? '2px solid #C9A84C' : '1px solid #8B5E3C', backgroundColor: expandedModule === mod.id ? '#2C1810' : '#F5ECD7' }}
                >
                  <button
                    className="w-full text-left flex items-center gap-5 p-5"
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  >
                    <span
                      className="w-10 h-10 flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ fontFamily: '"IBM Plex Mono", monospace', backgroundColor: expandedModule === mod.id ? '#C9A84C' : '#2C1810', color: expandedModule === mod.id ? '#2C1810' : '#C9A84C' }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-lg" style={{ fontFamily: '"Playfair Display", serif', color: expandedModule === mod.id ? '#F5ECD7' : '#2C1810' }}>{mod.title}</div>
                      <div className="text-xs mt-0.5" style={{ fontFamily: '"IBM Plex Mono", monospace', color: expandedModule === mod.id ? '#8B5E3C' : '#704214' }}>{mod.lessons.length} lessons</div>
                    </div>
                    <span className="text-xl flex-shrink-0" style={{ color: '#C9A84C' }}>
                      {expandedModule === mod.id ? '−' : '+'}
                    </span>
                  </button>

                  {expandedModule === mod.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid #3D2B1F' }}>
                      {mod.description && (
                        <p className="px-7 py-4 text-sm" style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}>{mod.description}</p>
                      )}
                      {mod.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-4 px-7 py-3 text-sm" style={{ borderTop: '1px solid #3D2B1F' }}>
                          <span style={{ color: '#C9A84C', width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>
                            {lesson.isFree ? '▶' : '◈'}
                          </span>
                          <span className="flex-1" style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}>{lesson.title}</span>
                          {lesson.isFree && (
                            <span className="text-xs px-2 py-0.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#1A3A3A', border: '1px solid #1A3A3A' }}>
                              Free preview
                            </span>
                          )}
                          {lesson.durationMinutes && (
                            <span className="text-xs" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>{lesson.durationMinutes}m</span>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* From the Inner Circle — Testimonials */}
      <section className="py-20 px-6" style={{ backgroundColor: '#2C1810' }}>
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-14"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            From the Inner Circle
          </motion.h2>
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "I've done therapy, journaling, all of it. The Cipher was different. It didn't just ask me to feel — it asked me to decode. By Module 3, I could name what I was doing in real time. That changed everything.", name: 'Kezia M.', tier: 'The Cipher' },
              { quote: "The Legacy Letter I wrote in Station 6 is the most important thing I've ever put on paper. I never thought about healing as something I was doing for my children too. Now I can't think about it any other way.", name: 'David R.', tier: 'The Cipher + Coaching' },
              { quote: "Station 5 — the Resilience Stack — is now my morning. Every single day. I didn't think I was capable of daily practice, but this made it feel like self-respect, not discipline.", name: 'Amara J.', tier: 'Full Immersion' },
            ].map((t, i) => (
              <motion.div key={i} variants={itemVariants} className="p-8" style={{ backgroundColor: '#3D2B1F', border: '1px solid #704214' }}>
                <p className="italic leading-relaxed mb-6 text-lg" style={{ fontFamily: '"Playfair Display", serif', color: '#E8DCBE' }}>"{t.quote}"</p>
                <div>
                  <div className="font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#F5ECD7' }}>{t.name}</div>
                  <div className="text-xs mt-1" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}>{t.tier}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#1A0E09' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>Enter the Cipher</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}>
              Three tiers of access. One transformation. Choose the level of support that matches where you are.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.name} variants={itemVariants}
                className="p-8 flex flex-col"
                style={{
                  backgroundColor: tier.highlighted ? '#2C1810' : '#1A0E09',
                  border: tier.highlighted ? '2px solid #C9A84C' : '1px solid #3D2B1F',
                }}
              >
                {tier.highlighted && (
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}>
                    Most Popular
                  </p>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>{tier.name}</h3>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>{tier.price}</div>
                <p className="text-sm mb-8" style={{ fontFamily: '"Libre Baskerville", serif', color: '#704214' }}>{tier.description}</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }}>✓</span>
                      <span style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleEnroll(tier)}
                  disabled={enrolling}
                  className="w-full py-3.5 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.1em',
                    backgroundColor: tier.highlighted ? '#C9A84C' : 'transparent',
                    color: tier.highlighted ? '#2C1810' : '#C9A84C',
                    border: tier.highlighted ? 'none' : '1px solid #C9A84C',
                    cursor: 'pointer',
                  }}
                >
                  {enrolling ? 'Processing…' : tier.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-sm mt-10" style={{ fontFamily: '"Libre Baskerville", serif', color: '#704214' }}>
            All tiers include lifetime access. Questions?{' '}
            <Link to="/booking" className="underline" style={{ color: '#C9A84C' }}>Book a free consultation</Link>.
          </motion.p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#2C1810' }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.04 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="course-cta-circles" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="56" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="38" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#course-cta-circles)" />
          </svg>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto relative"
        >
          <p className="text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.3em' }}>The cipher is open</p>
          <h2 className="text-5xl font-bold mb-6" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>Step In.</h2>
          <p className="text-xl leading-relaxed mb-10" style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}>
            Once you are in the cipher, you are held. And what is held can heal.
          </p>
          <a
            href="#pricing"
            className="inline-block px-12 py-4 uppercase tracking-widest text-sm font-bold transition-opacity hover:opacity-80"
            style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', letterSpacing: '0.12em' }}
          >
            Choose Your Path
          </a>
        </motion.div>
      </section>
    </div>
  );
}
