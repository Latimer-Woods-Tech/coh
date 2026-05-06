import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
}

interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutStatus = searchParams.get('checkout') as 'success' | 'cancelled' | null;

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        const data = (await bookingApi.listServices()) as unknown as Service[];
        setServices(data || []);
        setServicesError(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load services';
        setServicesError(msg);
        console.error('Failed to load services:', err);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  // Load availability when service or date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const loadAvailability = async () => {
      try {
        setSlotsLoading(true);
        const data = (await bookingApi.getAvailability(selectedService, selectedDate)) as unknown as AvailabilitySlot[];
        setAvailableSlots(data || []);
        setSelectedTime(''); // Reset time when date changes
      } catch (err: any) {
        console.error('Failed to load availability:', err);
        // Fallback to empty slots
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    loadAvailability();
  }, [selectedService, selectedDate]);

  const service = services.find((s) => s.id === selectedService);
  const isReady = selectedService && selectedDate && selectedTime;

  const next14 = useMemo(() => Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  }), []);

  const handleConfirmSession = async () => {
    if (!isReady || !user) {
      if (!user) navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Availability API returns 24-hour HH:mm slot strings.
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00Z`);

      if (Number.isNaN(scheduledAt.getTime())) {
        setSubmitError('Selected time is invalid. Please choose another slot.');
        return;
      }

      const result = await bookingApi.createAppointment({
        serviceId: selectedService,
        scheduledAt: scheduledAt.toISOString(),
      });

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // Navigate to confirmation page or dashboard
      navigate('/'); // Or redirect to appointments page once created
    } catch (err: any) {
      const msg = err?.message || 'Failed to create appointment';
      setSubmitError(msg);
      console.error('Failed to create appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>

      {/* Stripe redirect banners */}
      {checkoutStatus === 'success' && (
        <div
          className="px-6 py-4 text-sm font-medium text-center"
          style={{ backgroundColor: '#2d6a4f', color: '#d8f3dc', fontFamily: '"DM Sans", sans-serif' }}
        >
          ✓ Your session is booked. You'll receive a confirmation shortly. &nbsp;
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
          Payment was not completed. Your slot has been released — select a new time below.
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
            Before the blade touches skin, there is always a consultation. This session centers
            ritual, reflective care, and conversation in the chair. It is restorative, not
            clinical therapy.
          </motion.p>
          <motion.p
            {...fade(0.28)}
            className="text-sm max-w-2xl mt-5"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.7 }}
          >
            Best for people seeking presence, structure, and barber-led reflection.
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

              {servicesError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 text-sm mb-4"
                  style={{
                    backgroundColor: 'rgba(160, 82, 45, 0.15)',
                    border: '1px solid #A0522D',
                    color: '#704214',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {servicesError}
                </motion.div>
              )}

              {servicesLoading ? (
                <div style={{ color: '#704214', fontFamily: '"Libre Baskerville", serif' }}>
                  Loading services...
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => {
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
              )}
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
              {slotsLoading ? (
                <div style={{ color: '#704214', fontFamily: '"Libre Baskerville", serif' }}>
                  Loading available slots...
                </div>
              ) : availableSlots.length === 0 && selectedDate ? (
                <div style={{ color: '#704214', fontFamily: '"Libre Baskerville", serif' }}>
                  No available slots for this date. Please try another date.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {availableSlots
                    .filter((slot) => slot.available)
                    .map((slot) => {
                      const active = selectedTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
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
                          {slot.time}
                        </button>
                      );
                    })}
                </div>
              )}
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

              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2 text-xs mb-4"
                  style={{
                    backgroundColor: 'rgba(160, 82, 45, 0.15)',
                    border: '1px solid #A0522D',
                    color: '#E8DCBE',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {submitError}
                </motion.div>
              )}

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
                disabled={!isReady || isSubmitting}
                onClick={handleConfirmSession}
                className="w-full py-4 uppercase tracking-widest text-sm transition-opacity"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  backgroundColor: isReady && !isSubmitting ? '#C9A84C' : '#3D2B1F',
                  color: isReady && !isSubmitting ? '#2C1810' : '#704214',
                  border: 'none',
                  cursor: isReady && !isSubmitting ? 'pointer' : 'not-allowed',
                }}
              >
                {isSubmitting ? 'Confirming...' : isReady ? 'Confirm Session' : 'Select All Fields'}
              </button>

              {isReady && !submitError && (
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
