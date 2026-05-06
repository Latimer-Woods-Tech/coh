import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { trackEvent } from '@/lib/analytics';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

interface Event {
  id: string;
  slug: string;
  title: string;
  type?: string;
  typeLabel?: string;
  date: string;
  month?: string;
  day?: string;
  time: string;
  duration: string;
  attendees: number;
  price: number;
  description: string;
}

interface EventType {
  id: string;
  label: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([
    { id: 'all', label: 'All Events' },
  ]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  const [filter, setFilter] = useState('all');
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutStatus = searchParams.get('checkout') as 'success' | 'cancelled' | null;

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const data = (await eventsApi.listEvents()) as unknown as Event[];
        
        // Parse dates to extract month/day
        const processedEvents = (data || []).map((event) => {
          const eventDate = new Date(event.date);
          return {
            ...event,
            month: eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: String(eventDate.getDate()).padStart(2, '0'),
            type: event.type || 'other',
            typeLabel: event.typeLabel || 'Event',
          };
        });

        setEvents(processedEvents);

        // Extract unique event types
        const uniqueTypes = Array.from(
          new Set(processedEvents.map((e) => e.type))
        ).map((type) => ({
          id: type,
          label: type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        }));

        setEventTypes([
          { id: 'all', label: 'All Events' },
          ...uniqueTypes,
        ]);

        setEventsError(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load events';
        setEventsError(msg);
        console.error('Failed to load events:', err);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleRegister = async (event: Event) => {
    trackEvent('event_registration_clicked', {
      eventSlug: event.slug,
      eventTitle: event.title,
      eventType: event.type ?? 'unknown',
    });

    if (!user) {
      navigate('/login', { state: { redirect: '/events' } });
      return;
    }

    try {
      setRegisteringId(event.id);
      setRegisterError(null);

      const result = await eventsApi.registerEvent(event.slug, {
        smsOptIn: false, // Could be a toggle
      }) as { checkoutUrl?: string };

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // Show success message or redirect
      alert('You have registered for ' + event.title);
      // Navigate to events/registrations or stay and show confirmation
    } catch (err: any) {
      const msg = err?.message || 'Failed to register for event';
      setRegisterError(msg);
      console.error('Failed to register:', err);
    } finally {
      setRegisteringId(null);
    }
  };

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>

      {/* Stripe redirect banners */}
      {checkoutStatus === 'success' && (
        <div
          className="px-6 py-4 text-sm font-medium text-center"
          style={{ backgroundColor: '#2d6a4f', color: '#d8f3dc', fontFamily: '"DM Sans", sans-serif' }}
        >
          ✓ You're registered. Check your email for details. &nbsp;
          <a href="/profile" style={{ textDecoration: 'underline', color: '#b7e4c7' }}>
            View in My Cipher →
          </a>
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div
          className="px-6 py-4 text-sm font-medium text-center"
          style={{ backgroundColor: '#3d1f1f', color: '#fca5a5', fontFamily: '"DM Sans", sans-serif' }}
        >
          Registration was not completed. Select an event below to try again.
        </div>
      )}

      {/* Hero */}
      <section
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ backgroundColor: '#2C1810' }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.04 }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="events-circles" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
                <circle cx="70" cy="70" r="66" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
                <circle cx="70" cy="70" r="48" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                <circle cx="70" cy="70" r="30" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#events-circles)" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative">
          <motion.p
            {...fade(0)}
            className="uppercase tracking-widest text-xs mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}
          >
            The Stage & Inner Circle
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            The Cipher is Open
          </motion.h1>
          <motion.p
            {...fade(0.2)}
            className="text-lg max-w-2xl leading-relaxed"
            style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}
          >
            A cipher, in the tradition of hip-hop, is a circle of artists freestyling together —
            each one elevating the next. These gatherings are that circle: educational,
            communal, and restorative. They are not group therapy.
          </motion.p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Webinars',
              body: 'Best for learning the framework, language, and worldview in a lower-friction live format.',
            },
            {
              title: 'Workshops',
              body: 'Best for guided reflection, exercises, and more deliberate practice with the material.',
            },
            {
              title: 'Retreats and Circles',
              body: 'Best for people ready for deeper accountability, extended immersion, and communal restoration.',
            },
          ].map((item) => (
            <motion.div key={item.title} {...fade()} className="p-5" style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}>
              <h2 className="mb-3" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '1.3rem' }}>
                {item.title}
              </h2>
              <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.8, fontSize: '14px' }}>
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Filter tabs */}
      <div
        className="border-b sticky top-16 z-10"
        style={{ backgroundColor: '#F5ECD7', borderColor: '#8B5E3C' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {eventTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className="relative px-5 py-4 transition-colors shrink-0"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  color: filter === type.id ? '#2C1810' : '#8B5E3C',
                  fontWeight: filter === type.id ? 600 : 400,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {type.label}
                {filter === type.id && (
                  <motion.div
                    layoutId="events-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#C9A84C' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Loading state */}
        {eventsLoading && (
          <motion.div
            {...fade()}
            className="text-center py-12"
            style={{
              fontFamily: '"Libre Baskerville", serif',
              color: '#704214',
            }}
          >
            Loading events...
          </motion.div>
        )}

        {/* Error state */}
        {eventsError && (
          <motion.div
            {...fade()}
            className="px-6 py-4 text-sm mb-8"
            style={{
              backgroundColor: 'rgba(160, 82, 45, 0.15)',
              border: '1px solid #A0522D',
              color: '#704214',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {eventsError}
          </motion.div>
        )}

        {/* Register error */}
        {registerError && (
          <motion.div
            {...fade()}
            className="px-6 py-4 text-sm mb-8"
            style={{
              backgroundColor: 'rgba(160, 82, 45, 0.15)',
              border: '1px solid #A0522D',
              color: '#704214',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {registerError}
          </motion.div>
        )}

        {!eventsLoading && events.length === 0 && !eventsError && (
          <motion.div
            {...fade()}
            className="text-center py-12"
            style={{
              fontFamily: '"Libre Baskerville", serif',
              color: '#704214',
            }}
          >
            No events available at this time.
          </motion.div>
        )}

        {!eventsLoading && events.length > 0 && (
          <div className="space-y-5">
            <AnimatePresence>
              {filtered.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex overflow-hidden"
                  style={{
                    backgroundColor: '#E8DCBE',
                    border: '1px solid #8B5E3C',
                  }}
                >
                  {/* Date panel */}
                  <div
                    className="shrink-0 w-20 flex flex-col items-center justify-center py-6"
                    style={{ backgroundColor: '#2C1810', borderRight: '1px solid #704214' }}
                  >
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: '#8B5E3C',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {event.month}
                    </span>
                    <span
                      className="text-3xl font-bold leading-none mt-1"
                      style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}
                    >
                      {event.day}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      {/* Type badge */}
                      <span
                        className="inline-block text-xs px-3 py-0.5 mb-3"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          letterSpacing: '0.08em',
                          border: '1px solid #8B5E3C',
                          color: '#704214',
                          backgroundColor: 'transparent',
                        }}
                      >
                        {event.typeLabel}
                      </span>
                      <h3
                        className="font-bold text-xl mb-2"
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          color: '#2C1810',
                        }}
                      >
                        {event.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed mb-3"
                        style={{
                          fontFamily: '"Libre Baskerville", serif',
                          color: '#3D2B1F',
                          maxWidth: '560px',
                        }}
                      >
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1">
                        <span
                          className="text-xs"
                          style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: '#8B5E3C',
                          }}
                        >
                          {event.time}
                        </span>
                        <span
                          className="text-xs"
                          style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: '#8B5E3C',
                          }}
                        >
                          {event.duration}
                        </span>
                        <span
                          className="text-xs"
                          style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: '#8B5E3C',
                          }}
                        >
                          {event.attendees} in the cipher
                        </span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="shrink-0 flex flex-col items-end gap-3 md:items-end">
                      {event.price === 0 ? (
                        <span
                          className="text-2xl font-bold"
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            color: '#1A3A3A',
                          }}
                        >
                          FREE
                        </span>
                      ) : (
                        <span
                          className="text-2xl font-bold"
                          style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}
                        >
                          ${event.price}
                        </span>
                      )}
                      <button
                        onClick={() => handleRegister(event)}
                        disabled={registeringId === event.id}
                        className="px-6 py-2 uppercase text-xs tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          backgroundColor: '#C9A84C',
                          color: '#2C1810',
                          border: 'none',
                          cursor: registeringId === event.id ? 'wait' : 'pointer',
                        }}
                      >
                        {registeringId === event.id
                          ? 'Registering...'
                          : event.type === 'retreat'
                          ? 'Apply'
                          : 'Register'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Closing cipher */}
        <motion.div
          {...fade(0.1)}
          className="mt-20 py-16 px-10 text-center relative overflow-hidden"
          style={{ backgroundColor: '#2C1810' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.05 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="events-close-pattern"
                  x="0"
                  y="0"
                  width="120"
                  height="120"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="60" cy="60" r="56" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                  <circle cx="60" cy="60" r="38" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#events-close-pattern)" />
            </svg>
          </div>
          <div className="relative">
            <p
              className="text-xs uppercase tracking-widest mb-8"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                color: '#C9A84C',
                letterSpacing: '0.3em',
              }}
            >
              The cipher is open
            </p>
            <p
              className="text-3xl md:text-4xl font-bold mb-2 italic"
              style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
            >
              Step in.
            </p>
            <p
              className="text-sm mt-6 max-w-md mx-auto leading-relaxed"
              style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}
            >
              Every man who enters this circle elevates the next. Join the gathering. Bring what you
              carry. Leave what you no longer need.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

