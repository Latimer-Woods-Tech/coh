import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/auth';

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  price: string;
  isPublished: boolean;
  totalModules: number;
  totalLessons: number;
  enrollmentCount: number;
  createdAt: string;
}

interface EnrollmentRow {
  enrollmentId: string;
  status: string;
  progressPercent: number;
  enrolledAt: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
}

interface Analytics {
  totals: {
    totalCourses: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
  };
  courseStats: Array<{
    courseId: string;
    courseTitle: string;
    enrollments: number;
    completions: number;
    avgProgress: number;
  }>;
}

const API = import.meta.env.VITE_API_URL ?? 'https://cypher-of-healing-api.workers.dev';

type TabId = 'overview' | 'courses' | 'students' | 'create';

export default function AdminCoursePage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create course form
  const [newCourse, setNewCourse] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    estimatedHours: '',
  });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);
    try {
      const [analyticsRes, coursesRes, enrollmentsRes] = await Promise.all([
        fetch(`${API}/api/admin/analytics`, { headers: authHeaders }),
        fetch(`${API}/api/admin/courses`, { headers: authHeaders }),
        fetch(`${API}/api/admin/enrollments?limit=50`, { headers: authHeaders }),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (coursesRes.ok) setCourses((await coursesRes.json()).courses ?? []);
      if (enrollmentsRes.ok) setEnrollments((await enrollmentsRes.json()).enrollments ?? []);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (user && user.role !== 'admin') { navigate('/'); return; }
    fetchData();
  }, [token, user, navigate, fetchData]);

  const togglePublish = async (course: CourseRow) => {
    setActionLoading(course.id);
    try {
      await fetch(`${API}/api/admin/courses/${course.id}/publish`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ publish: !course.isPublished }),
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, isPublished: !course.isPublished } : c
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    if (!newCourse.title || !newCourse.slug || !newCourse.price) {
      setCreateError('Title, slug, and price are required.');
      return;
    }
    setActionLoading('create');
    try {
      const res = await fetch(`${API}/api/admin/courses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newCourse),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create course');
      }
      const data = await res.json();
      setCourses((prev) => [data.course, ...prev]);
      setCreateSuccess(`Course "${data.course.title}" created successfully!`);
      setNewCourse({ title: '', slug: '', description: '', shortDescription: '', price: '', estimatedHours: '' });
      setActiveTab('courses');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const slugify = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Courses' },
    { id: 'students', label: 'Students' },
    { id: 'create', label: '+ New Course' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5ECD7' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Shared cell/label styles
  const cellStyle = { fontFamily: '"Libre Baskerville", serif', color: '#2C1810', fontSize: '0.875rem' };
  const subStyle = { fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', fontSize: '0.75rem' };
  const thStyle = { fontFamily: 'DM Sans, sans-serif', color: '#8B5E3C', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, padding: '0.75rem 1.5rem', backgroundColor: '#E8DCBE' };

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: '#F5ECD7' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}>
              Admin Panel
            </p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}>Course Administration</h1>
          </div>
          <Link to="/academy" className="text-sm transition-colors" style={{ fontFamily: 'DM Sans, sans-serif', color: '#8B5E3C' }}>
            ← View Academy
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid #8B5E3C' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-5 py-3 transition-colors"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.85rem',
                letterSpacing: '0.06em',
                color: activeTab === tab.id ? '#2C1810' : '#8B5E3C',
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #C9A84C' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Total Courses', value: analytics.totals.totalCourses },
                { label: 'Total Enrollments', value: analytics.totals.totalEnrollments },
                { label: 'Active Students', value: analytics.totals.activeEnrollments },
                { label: 'Completions', value: analytics.totals.completedEnrollments },
              ].map((stat) => (
                <div key={stat.label} className="p-6" style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>{stat.value ?? 0}</div>
                  <div className="text-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden" style={{ border: '1px solid #8B5E3C' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #8B5E3C', backgroundColor: '#2C1810' }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>Per-Course Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Course</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Enrollments</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Completions</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.courseStats.map((cs) => (
                      <tr key={cs.courseId} style={{ borderBottom: '1px solid #E8DCBE' }}>
                        <td className="px-6 py-4" style={cellStyle}>{cs.courseTitle}</td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{cs.enrollments}</td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{cs.completions}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-1" style={{ backgroundColor: '#E8DCBE' }}>
                              <div className="h-full" style={{ width: `${cs.avgProgress ?? 0}%`, backgroundColor: '#C9A84C' }} />
                            </div>
                            <span style={{ ...subStyle, width: '3rem', textAlign: 'right' }}>{cs.avgProgress ?? 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {analytics.courseStats.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-10 text-center" style={subStyle}>No course data yet. Create and publish a course to see analytics.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-hidden" style={{ border: '1px solid #8B5E3C' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #8B5E3C', backgroundColor: '#2C1810' }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>All Courses</h2>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-sm px-4 py-2 font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                  style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#C9A84C', color: '#2C1810', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}
                >
                  + New Course
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Title</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Modules</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Lessons</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Enrolled</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} style={{ borderBottom: '1px solid #E8DCBE' }}>
                        <td className="px-6 py-4">
                          <div style={cellStyle}>{course.title}</div>
                          <div style={{ ...subStyle, marginTop: '2px' }}>/{course.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-right" style={cellStyle}>${course.price}</td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{course.totalModules}</td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{course.totalLessons}</td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{course.enrollmentCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className="px-3 py-0.5 text-xs font-bold uppercase tracking-wide"
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              letterSpacing: '0.08em',
                              border: `1px solid ${course.isPublished ? '#1A3A3A' : '#8B5E3C'}`,
                              color: course.isPublished ? '#1A3A3A' : '#8B5E3C',
                              backgroundColor: 'transparent',
                            }}
                          >
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link to={`/academy/${course.slug}`} className="text-xs underline" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>
                              View
                            </Link>
                            <button
                              onClick={() => togglePublish(course)}
                              disabled={actionLoading === course.id}
                              className="text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
                              style={{ fontFamily: 'DM Sans, sans-serif', border: '1px solid #8B5E3C', color: '#2C1810', backgroundColor: 'transparent', cursor: 'pointer' }}
                            >
                              {actionLoading === course.id ? '…' : course.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center" style={subStyle}>
                          No courses yet.{' '}
                          <button onClick={() => setActiveTab('create')} className="underline" style={{ color: '#C9A84C', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            Create your first course
                          </button>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-hidden" style={{ border: '1px solid #8B5E3C' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #8B5E3C', backgroundColor: '#2C1810' }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}>Recent Enrollments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Student</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Course</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Progress</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => (
                      <tr key={e.enrollmentId} style={{ borderBottom: '1px solid #E8DCBE' }}>
                        <td className="px-6 py-4">
                          <div style={cellStyle}>{e.userName}</div>
                          <div style={{ ...subStyle, marginTop: '2px' }}>{e.userEmail}</div>
                        </td>
                        <td className="px-6 py-4" style={cellStyle}>{e.courseTitle}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide capitalize"
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              letterSpacing: '0.08em',
                              border: `1px solid ${e.status === 'completed' ? '#1A3A3A' : e.status === 'active' ? '#C9A84C' : '#8B5E3C'}`,
                              color: e.status === 'completed' ? '#1A3A3A' : e.status === 'active' ? '#C9A84C' : '#8B5E3C',
                              backgroundColor: 'transparent',
                            }}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1" style={{ backgroundColor: '#E8DCBE' }}>
                              <div className="h-full" style={{ width: `${e.progressPercent}%`, backgroundColor: '#C9A84C' }} />
                            </div>
                            <span style={{ ...subStyle, width: '2rem', textAlign: 'right' }}>{e.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" style={subStyle}>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {enrollments.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center" style={subStyle}>No enrollments yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Course Tab */}
        {activeTab === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="max-w-2xl">
              <div className="p-8" style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}>
                <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}>Create New Course</h2>

                {createError && (
                  <div className="mb-4 px-4 py-3 text-sm" style={{ backgroundColor: '#FFF5F5', border: '1px solid #A0522D', color: '#A0522D' }}>{createError}</div>
                )}
                {createSuccess && (
                  <div className="mb-4 px-4 py-3 text-sm" style={{ backgroundColor: '#F0FFF4', border: '1px solid #1A3A3A', color: '#1A3A3A' }}>{createSuccess}</div>
                )}

                <form onSubmit={handleCreateCourse} className="space-y-5">
                  {/* Field helper */}
                  {[
                    { label: 'Course Title *', type: 'text', value: newCourse.title, placeholder: 'The Cipher of Healing', required: true,
                      onChange: (val: string) => setNewCourse((p) => ({ ...p, title: val, slug: p.slug || slugify(val) })) },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>{field.label}</label>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 outline-none transition-colors"
                        style={{ fontFamily: '"Libre Baskerville", serif', border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7', color: '#2C1810' }}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>URL Slug *</label>
                    <div className="flex items-center" style={{ border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7' }}>
                      <span className="px-3 py-3 text-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', borderRight: '1px solid #8B5E3C', backgroundColor: '#E8DCBE' }}>/academy/</span>
                      <input
                        type="text"
                        value={newCourse.slug}
                        onChange={(e) => setNewCourse((p) => ({ ...p, slug: slugify(e.target.value) }))}
                        placeholder="cipher-of-healing"
                        className="flex-1 px-4 py-3 outline-none"
                        style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#2C1810', backgroundColor: '#F5ECD7', border: 'none' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>Short Description</label>
                    <input
                      type="text"
                      value={newCourse.shortDescription}
                      onChange={(e) => setNewCourse((p) => ({ ...p, shortDescription: e.target.value }))}
                      placeholder="A brief one-line course description"
                      className="w-full px-4 py-3 outline-none"
                      style={{ fontFamily: '"Libre Baskerville", serif', border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7', color: '#2C1810' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>Full Description</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      placeholder="A detailed description of the course…"
                      className="w-full px-4 py-3 outline-none resize-none"
                      style={{ fontFamily: '"Libre Baskerville", serif', border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7', color: '#2C1810' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>Price (USD) *</label>
                      <div className="flex items-center" style={{ border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7' }}>
                        <span className="px-3 py-3 text-sm" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', borderRight: '1px solid #8B5E3C', backgroundColor: '#E8DCBE' }}>$</span>
                        <input
                          type="number" step="0.01" min="0"
                          value={newCourse.price}
                          onChange={(e) => setNewCourse((p) => ({ ...p, price: e.target.value }))}
                          placeholder="197.00"
                          className="flex-1 px-4 py-3 outline-none"
                          style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#2C1810', backgroundColor: '#F5ECD7', border: 'none' }}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5" style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}>Estimated Hours</label>
                      <input
                        type="number" step="0.5" min="0"
                        value={newCourse.estimatedHours}
                        onChange={(e) => setNewCourse((p) => ({ ...p, estimatedHours: e.target.value }))}
                        placeholder="12"
                        className="w-full px-4 py-3 outline-none"
                        style={{ fontFamily: '"IBM Plex Mono", monospace', border: '1px solid #8B5E3C', backgroundColor: '#F5ECD7', color: '#2C1810' }}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading === 'create'}
                      className="w-full py-3.5 font-bold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#2C1810', color: '#C9A84C', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
                    >
                      {actionLoading === 'create' ? 'Creating…' : 'Create Course (Draft)'}
                    </button>
                    <p className="text-center text-xs mt-3" style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}>
                      The course will be created as a draft. Publish it from the Courses tab when ready.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
