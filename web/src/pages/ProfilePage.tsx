import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { bookingApi, storeApi, academyApi, eventsApi } from '@/lib/api';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

type Tab = 'appointments' | 'enrollments' | 'orders' | 'events';

interface Appointment {
  id: string;
  status: string;
  scheduledAt: string;
  endAt: string;
  notes?: string;
  service?: { name: string; durationMinutes: number };
}

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string;
  course?: { title: string; slug: string; price: number };
  progressPercent?: number;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  totalCents: number;
  items?: Array<{ product?: { name: string }; quantity: number; priceCents: number }>;
}

interface EventRegistration {
  id: string;
  createdAt: string;
  event?: { title: string; scheduledAt: string; type: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  completed: 'text-neutral-700 bg-neutral-100 border-neutral-200',
  cancelled: 'text-red-600 bg-red-50 border-red-200',
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  paid: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  in_progress: 'text-blue-700 bg-blue-50 border-blue-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'text-neutral-600 bg-neutral-100 border-neutral-200';
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('appointments');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Load data for the active tab on first visit
  useEffect(() => {
    if (!user) return;
    setError(null);

    if (activeTab === 'appointments' && appointments.length === 0) {
      setAppointmentsLoading(true);
      bookingApi
        .getAppointments()
        .then((data: unknown) => {
          const res = data as { appointments?: Appointment[] } | Appointment[];
          setAppointments(Array.isArray(res) ? res : (res?.appointments ?? []));
        })
        .catch(() => setError('Failed to load appointments'))
        .finally(() => setAppointmentsLoading(false));
    }

    if (activeTab === 'enrollments' && enrollments.length === 0) {
      setEnrollmentsLoading(true);
      academyApi
        .getEnrollments()
        .then((data: unknown) => {
          const res = data as { enrollments?: Enrollment[] } | Enrollment[];
          setEnrollments(Array.isArray(res) ? res : (res?.enrollments ?? []));
        })
        .catch(() => setError('Failed to load enrollments'))
        .finally(() => setEnrollmentsLoading(false));
    }

    if (activeTab === 'orders' && orders.length === 0) {
      setOrdersLoading(true);
      storeApi
        .getOrders()
        .then((data: unknown) => {
          const res = data as { orders?: Order[] } | Order[];
          setOrders(Array.isArray(res) ? res : (res?.orders ?? []));
        })
        .catch(() => setError('Failed to load orders'))
        .finally(() => setOrdersLoading(false));
    }

    if (activeTab === 'events' && eventRegistrations.length === 0) {
      setEventsLoading(true);
      eventsApi
        .getRegistrations()
        .then((data: unknown) => {
          const res = data as { registrations?: EventRegistration[] } | EventRegistration[];
          setEventRegistrations(Array.isArray(res) ? res : (res?.registrations ?? []));
        })
        .catch(() => setError('Failed to load event registrations'))
        .finally(() => setEventsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  if (!user) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'appointments', label: 'Appointments' },
    { id: 'enrollments', label: 'Academy' },
    { id: 'orders', label: 'Orders' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>
      {/* Header */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{ backgroundColor: '#2C1810' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, transparent 30%, rgba(201,168,76,0.04) 30%, rgba(201,168,76,0.04) 30.5%, transparent 30.5%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(201,168,76,0.025) 50%, rgba(201,168,76,0.025) 50.5%, transparent 50.5%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div {...fade()}>
            <p
              className="uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
            >
              Your Cipher
            </p>
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: '#F5ECD7',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              }}
            >
              {user.name}
            </h1>
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: '#8B5E3C', fontSize: '14px', marginTop: '6px' }}>
              {user.email}
              {user.phone ? ` · ${user.phone}` : ''}
            </p>
          </motion.div>
          <motion.div {...fade(0.1)} className="mt-6 flex gap-4">
            <button
              onClick={() => void logout().then(() => navigate('/'))}
              className="btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#E8DCBE',
                fontSize: '12px',
                padding: '0.5rem 1.25rem',
              }}
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-xl"
          style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                backgroundColor: activeTab === tab.id ? '#2C1810' : 'transparent',
                color: activeTab === tab.id ? '#F5ECD7' : '#704214',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Appointments ─────────────────────────────────────────── */}
        {activeTab === 'appointments' && (
          <motion.div {...fade()}>
            {appointmentsLoading ? (
              <LoadingSpinner />
            ) : appointments.length === 0 ? (
              <EmptyState
                label="No appointments yet"
                cta="Book a Session"
                ctaPath="/booking"
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="rounded-xl border p-5"
                    style={{ backgroundColor: '#E8DCBE', borderColor: '#8B5E3C' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p
                          className="font-bold"
                          style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '17px' }}
                        >
                          {appt.service?.name ?? 'Session'}
                        </p>
                        <p
                          className="mt-1 text-sm"
                          style={{ fontFamily: '"Libre Baskerville", serif', color: '#704214' }}
                        >
                          {formatDateTime(appt.scheduledAt)}
                          {appt.service?.durationMinutes
                            ? ` · ${appt.service.durationMinutes} min`
                            : ''}
                        </p>
                        {appt.notes && (
                          <p className="mt-1 text-xs italic" style={{ color: '#8B5E3C' }}>
                            {appt.notes}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Academy Enrollments ───────────────────────────────────── */}
        {activeTab === 'enrollments' && (
          <motion.div {...fade()}>
            {enrollmentsLoading ? (
              <LoadingSpinner />
            ) : enrollments.length === 0 ? (
              <EmptyState
                label="No courses enrolled yet"
                cta="Enter the Academy"
                ctaPath="/academy"
              />
            ) : (
              <div className="space-y-3">
                {enrollments.map((en) => (
                  <div
                    key={en.id}
                    className="rounded-xl border p-5"
                    style={{ backgroundColor: '#E8DCBE', borderColor: '#8B5E3C' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <p
                          className="font-bold"
                          style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '17px' }}
                        >
                          {en.course?.title ?? 'Course'}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: '#8B5E3C' }}>
                          Enrolled {formatDate(en.enrolledAt)}
                          {en.completedAt ? ` · Completed ${formatDate(en.completedAt)}` : ''}
                        </p>
                        {typeof en.progressPercent === 'number' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1" style={{ color: '#704214' }}>
                              <span>Progress</span>
                              <span>{en.progressPercent}%</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C', opacity: 0.2 }}>
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ backgroundColor: '#C9A84C', width: `${en.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={en.status} />
                        {en.course?.slug && (
                          <a
                            href={`/academy/${en.course.slug}`}
                            className="btn btn-primary"
                            style={{ fontSize: '11px', padding: '0.4rem 1rem' }}
                          >
                            Continue →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Orders ───────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <motion.div {...fade()}>
            {ordersLoading ? (
              <LoadingSpinner />
            ) : orders.length === 0 ? (
              <EmptyState
                label="No orders yet"
                cta="Visit the Vault"
                ctaPath="/store"
              />
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border p-5"
                    style={{ backgroundColor: '#E8DCBE', borderColor: '#8B5E3C' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p
                          className="font-bold"
                          style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '17px' }}
                        >
                          Order
                          <span className="ml-2 text-xs font-mono text-neutral-500">
                            #{order.id.slice(0, 8)}
                          </span>
                        </p>
                        {order.items && order.items.length > 0 && (
                          <p className="mt-1 text-sm" style={{ color: '#704214' }}>
                            {order.items.map((i) => i.product?.name ?? 'Item').join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs" style={{ color: '#8B5E3C' }}>
                          {formatDate(order.createdAt)} · {formatCents(order.totalCents)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Event Registrations ───────────────────────────────────── */}
        {activeTab === 'events' && (
          <motion.div {...fade()}>
            {eventsLoading ? (
              <LoadingSpinner />
            ) : eventRegistrations.length === 0 ? (
              <EmptyState
                label="No event registrations yet"
                cta="Join a Live Cipher"
                ctaPath="/events"
              />
            ) : (
              <div className="space-y-3">
                {eventRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="rounded-xl border p-5"
                    style={{ backgroundColor: '#E8DCBE', borderColor: '#8B5E3C' }}
                  >
                    <p
                      className="font-bold"
                      style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '17px' }}
                    >
                      {reg.event?.title ?? 'Event'}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: '#704214' }}>
                      {formatDateTime(reg.event?.scheduledAt)}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: '#8B5E3C' }}>
                      Registered {formatDate(reg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

function EmptyState({ label, cta, ctaPath }: { label: string; cta: string; ctaPath: string }) {
  return (
    <div
      className="rounded-2xl border p-12 text-center"
      style={{ backgroundColor: '#E8DCBE', borderColor: '#8B5E3C', borderStyle: 'dashed' }}
    >
      <p
        className="mb-4"
        style={{ fontFamily: '"Libre Baskerville", Georgia, serif', color: '#704214', fontSize: '16px' }}
      >
        {label}
      </p>
      <a href={ctaPath} className="btn btn-primary" style={{ fontSize: '12px' }}>
        {cta} →
      </a>
    </div>
  );
}
