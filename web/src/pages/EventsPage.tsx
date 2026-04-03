import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const EVENTS = [
  {
    id: '1',
    title: 'The Open Cipher — Monthly Webinar',
    type: 'webinar',
    typeLabel: 'The Open Cipher',
    date: '2026-04-15',
    month: 'APR',
    day: '15',
    time: '7:00 PM EST',
    duration: '90 minutes',
    attendees: 120,
    price: 0,
    description:
      'In hip-hop, a cipher is an open circle — anyone can step in and contribute. This monthly webinar is that circle. A live, open gathering to decode patterns, share tools, and elevate each other.',
  },
  {
    id: '2',
    title: 'Breaking the Code — Station 3 Deep Dive',
    type: 'workshop',
    typeLabel: 'Workshop',
    date: '2026-04-22',
    month: 'APR',
    day: '22',
    time: '6:00 PM EST',
    duration: '2 hours',
    attendees: 40,
    price: 29,
    description:
      'A focused workshop on trauma responses and daily triggers. We\'ll build your Trigger Tracker together, live. Evidence-informed. Practically grounded.',
  },
  {
    id: '3',
    title: 'The Cipher Summit — Spring 2026',
    type: 'summit',
    typeLabel: 'Summit',
    date: '2026-05-10',
    month: 'MAY',
    day: '10',
    time: '10:00 AM EST',
    duration: 'Full Day',
    attendees: 250,
    price: 97,
    description:
      'A full-day gathering of healers, barbers, and men committed to breaking generational cycles. Multi-speaker. Practical sessions. The lineage made visible.',
  },
  {
    id: '4',
    title: 'The Cipher Retreat — The Factory',
    type: 'retreat',
    typeLabel: 'Retreat',
    date: '2026-06-06',
    month: 'JUN',
    day: '06',
    time: 'Friday – Sunday',
    duration: '3 days',
    attendees: 30,
    price: 497,
    description:
      'Immersive. Intimate. Three days at The Factory: the full 6-station journey delivered live, in community, with the Cypher and a cohort of 30. Applications only.',
  },
  {
    id: '5',
    title: 'Legacy Letter Workshop',
    type: 'workshop',
    typeLabel: 'Workshop',
    date: '2026-04-29',
    month: 'APR',
    day: '29',
    time: '7:00 PM EST',
    duration: '2 hours',
    attendees: 35,
    price: 29,
    description:
      'Station 6 made live. We write our Legacy Letters together. You will declare what you choose to pass down and what you choose to end — in community, in the cipher.',
  },
  {
    id: '6',
    title: 'The Inner Circle — Quarterly Gathering',
    type: 'inner-circle',
    typeLabel: 'Inner Circle',
    date: '2026-05-01',
    month: 'MAY',
    day: '01',
    time: '6:00 PM EST',
    duration: '3 hours',
    attendees: 20,
    price: 0,
    description:
      'Exclusive to Inner Circle members. Quarterly deep-dive with the Cypher, peer accountability, and direct access. The circle, sustained.',
  },
];

const TYPES = [
  { id: 'all',          label: 'All Events' },
  { id: 'webinar',      label: 'The Open Cipher' },
  { id: 'workshop',     label: 'Workshops' },
  { id: 'summit',       label: 'Summit' },
  { id: 'retreat',      label: 'Retreat' },
  { id: 'inner-circle', label: 'Inner Circle' },
];

export default function EventsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? EVENTS : EVENTS.filter((e) => e.type === filter);

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>

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
            each one elevating the next. These gatherings are that circle. Step in.
          </motion.p>
        </div>
      </section>

      {/* Filter tabs */}
      <div
        className="border-b sticky top-16 z-10"
        style={{ backgroundColor: '#F5ECD7', borderColor: '#8B5E3C' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TYPES.map((type) => (
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
                    style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', letterSpacing: '0.1em' }}
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
                      style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}
                    >
                      {event.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-3"
                      style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', maxWidth: '560px' }}
                    >
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      <span
                        className="text-xs"
                        style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
                      >
                        {event.time}
                      </span>
                      <span
                        className="text-xs"
                        style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
                      >
                        {event.duration}
                      </span>
                      <span
                        className="text-xs"
                        style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
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
                        style={{ fontFamily: 'DM Sans, sans-serif', color: '#1A3A3A' }}
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
                      className="px-6 py-2 uppercase text-xs tracking-widest transition-opacity hover:opacity-80"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        backgroundColor: '#C9A84C',
                        color: '#2C1810',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {event.type === 'retreat' || event.type === 'inner-circle' ? 'Apply' : 'Register'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Closing cipher */}
        <motion.div
          {...fade(0.1)}
          className="mt-20 py-16 px-10 text-center relative overflow-hidden"
          style={{ backgroundColor: '#2C1810' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.05 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="events-close-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
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
              style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.3em' }}
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
