import { motion } from 'framer-motion';
import { useState } from 'react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const SERVICES = [
  {
    id: '1',
    name: 'The Chair — Signature Session',
    duration: '60 min',
    price: 75,
    description:
      'The full barbershop experience rooted in the lineage. Precision cut, beard work, and restoration oil treatment. The consultation is part of the session.',
  },
  {
    id: '2',
    name: 'The Cipher Consultation',
    duration: '90 min',
    price: 150,
    description:
      'One-on-one with the Cypher. Deep, deliberate healing work — the ancient relationship of healer and seeker, restored. Includes a personalized Cipher framework session.',
  },
  {
    id: '3',
    name: 'The Chair + Cipher',
    duration: '120 min',
    price: 200,
    description:
      'The complete offering. Begin in the chair, end with the cipher. Grooming and healing as one act — because they always were.',
  },
  {
    id: '4',
    name: 'Follow-Up Session',
    duration: '45 min',
    price: 60,
    description:
      'Return to the chair. Continue the work. Maintain what you are building.',
  },
];

const TIME_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM'];

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const service = SERVICES.find((s) => s.id === selectedService);
  const isReady = selectedService && selectedDate && selectedTime;

  const next14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

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
              <pattern id="book-circles" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A84C" strokeWidth="0.7" />
                <circle cx="50" cy="50" r="32" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="18" fill="none" stroke="#C9A84C" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#book-circles)" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative">
          <motion.p
            {...fade(0)}
            className="uppercase tracking-widest text-xs mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}
          >
            The Chair
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            Book Your Session
          </motion.h1>
          <motion.p
            {...fade(0.2)}
            className="text-lg max-w-2xl leading-relaxed"
            style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}
          >
            Before the blade touches skin, there is always a consultation. Sit down. The barber's
            first act is to ask what you are carrying and what you are ready to release.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Steps */}
          <div className="lg:col-span-2 space-y-10">

            {/* Step 1 — Service */}
            <motion.div {...fade(0)}>
              <p
                className="uppercase text-xs tracking-widest mb-5"
                style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
              >
                01 — Select a Service
              </p>
              <div className="space-y-3">
                {SERVICES.map((svc) => {
                  const active = selectedService === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedService(svc.id)}
                      className="w-full text-left transition-all"
                      style={{
                        padding: '1.25rem 1.5rem',
                        border: active ? '2px solid #C9A84C' : '1px solid #8B5E3C',
                        backgroundColor: active ? '#2C1810' : '#E8DCBE',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3
                            className="font-bold mb-1"
                            style={{
                              fontFamily: '"Playfair Display", serif',
                              fontSize: '1.05rem',
                              color: active ? '#F5ECD7' : '#2C1810',
                            }}
                          >
                            {svc.name}
                          </h3>
                          <p
                            className="text-sm leading-relaxed"
                            style={{
                              fontFamily: '"Libre Baskerville", serif',
                              color: active ? '#E8DCBE' : '#3D2B1F',
                            }}
                          >
                            {svc.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="font-bold text-lg"
                            style={{
                              fontFamily: 'DM Sans, sans-serif',
                              color: active ? '#C9A84C' : '#2C1810',
                            }}
                          >
                            ${svc.price}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{
                              fontFamily: '"IBM Plex Mono", monospace',
                              color: active ? '#8B5E3C' : '#704214',
                            }}
                          >
                            {svc.duration}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Step 2 — Date */}
            <motion.div {...fade(0.05)}>
              <p
                className="uppercase text-xs tracking-widest mb-5"
                style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
              >
                02 — Choose a Date
              </p>
              <div className="flex gap-2 flex-wrap">
                {next14.map(({ iso, day, num, month }) => {
                  const active = selectedDate === iso;
                  return (
                    <button
                      key={iso}
                      onClick={() => setSelectedDate(iso)}
                      className="transition-all"
                      style={{
                        width: '72px',
                        padding: '0.75rem 0',
                        textAlign: 'center',
                        border: active ? '2px solid #C9A84C' : '1px solid #8B5E3C',
                        backgroundColor: active ? '#2C1810' : '#E8DCBE',
                        cursor: 'pointer',
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          color: active ? '#8B5E3C' : '#704214',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {day}
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          color: active ? '#C9A84C' : '#2C1810',
                        }}
                      >
                        {num}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          color: active ? '#8B5E3C' : '#704214',
                        }}
                      >
                        {month}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Step 3 — Time */}
            <motion.div {...fade(0.1)}>
              <p
                className="uppercase text-xs tracking-widest mb-5"
                style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
              >
                03 — Select a Time
              </p>
              <div className="flex flex-wrap gap-3">
                {TIME_SLOTS.map((slot) => {
                  const active = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className="transition-all"
                      style={{
                        padding: '0.5rem 1.25rem',
                        border: active ? '2px solid #C9A84C' : '1px solid #8B5E3C',
                        backgroundColor: active ? '#2C1810' : '#E8DCBE',
                        cursor: 'pointer',
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.85rem',
                        color: active ? '#C9A84C' : '#2C1810',
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-24 p-8"
              style={{ backgroundColor: '#2C1810', border: '1px solid #704214' }}
            >
              <p
                className="uppercase text-xs tracking-widest mb-6"
                style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}
              >
                Your Session
              </p>

              {/* Concentric cipher mark */}
              <div className="flex items-center justify-center mb-8">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="30" stroke="#C9A84C" strokeWidth="1" />
                  <circle cx="32" cy="32" r="20" stroke="#C9A84C" strokeWidth="0.8" opacity="0.6" />
                  <circle cx="32" cy="32" r="10" stroke="#C9A84C" strokeWidth="0.6" opacity="0.4" />
                  <circle cx="32" cy="32" r="3" fill="#C9A84C" opacity="0.5" />
                </svg>
              </div>

              {service ? (
                <div className="space-y-4 mb-8">
                  <div style={{ borderBottom: '1px solid #3D2B1F', paddingBottom: '1rem' }}>
                    <p className="text-xs mb-1" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>Service</p>
                    <p className="font-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7', fontSize: '1rem' }}>{service.name}</p>
                  </div>
                  {selectedDate && (
                    <div style={{ borderBottom: '1px solid #3D2B1F', paddingBottom: '1rem' }}>
                      <p className="text-xs mb-1" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>Date</p>
                      <p className="font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#F5ECD7' }}>{selectedDate}</p>
                    </div>
                  )}
                  {selectedTime && (
                    <div style={{ borderBottom: '1px solid #3D2B1F', paddingBottom: '1rem' }}>
                      <p className="text-xs mb-1" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>Time</p>
                      <p className="font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#F5ECD7' }}>{selectedTime}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}>Total</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C' }}>${service.price}</p>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm italic mb-8 text-center leading-relaxed"
                  style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}
                >
                  Select a service to begin.
                </p>
              )}

              <button
                disabled={!isReady}
                className="w-full py-4 uppercase tracking-widest text-sm transition-opacity"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  backgroundColor: isReady ? '#C9A84C' : '#3D2B1F',
                  color: isReady ? '#2C1810' : '#704214',
                  border: 'none',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                }}
              >
                {isReady ? 'Confirm Session' : 'Select All Fields'}
              </button>

              {isReady && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center mt-4 leading-relaxed italic"
                  style={{ fontFamily: '"Libre Baskerville", serif', color: '#8B5E3C' }}
                >
                  Your session is confirmed. Arrive as you are. Leave elevated.
                </motion.p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
