import { motion } from 'framer-motion';
import { useState } from 'react';

export default function BookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const services = [
    { id: '1', name: 'Initial Consultation', duration: 60, price: 150 },
    { id: '2', name: 'Follow-up Session', duration: 45, price: 100 },
    { id: '3', name: 'Energy Healing', duration: 90, price: 200 },
    { id: '4', name: 'Group Workshop', duration: 120, price: 50 },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">Book Your Session</h1>
          <p className="text-xl text-dark-600">
            Schedule a personal session with our experienced practitioners
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Services */}
          <div className="lg:col-span-2">
            <div className="card p-8 mb-8">
              <h2 className="text-2xl font-serif font-bold mb-6">Select a Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <motion.button
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedService === service.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dark-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-bold mb-1">{service.name}</div>
                    <div className="text-sm text-dark-600">
                      {service.duration} min • ${service.price}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="card p-8">
              <h2 className="text-2xl font-serif font-bold mb-6">Select Date</h2>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = i === 0;
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();

                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        selectedDate === dateStr
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-dark-200 hover:border-primary-300'
                      } ${isToday ? 'bg-dark-100' : ''}`}
                    >
                      <div className="text-xs font-bold">{dayName}</div>
                      <div className="text-lg">{dayNum}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-8 h-fit sticky top-24">
            <h3 className="text-2xl font-serif font-bold mb-6">Booking Summary</h3>
            {selectedService && (
              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-dark-200">
                  <div className="text-sm text-dark-600 mb-1">Service</div>
                  <div className="font-bold">
                    {services.find((s) => s.id === selectedService)?.name}
                  </div>
                </div>
                {selectedDate && (
                  <div className="pb-4 border-b border-dark-200">
                    <div className="text-sm text-dark-600 mb-1">Date</div>
                    <div className="font-bold">{selectedDate}</div>
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-primary w-full">
              {selectedService && selectedDate ? 'Continue to Checkout' : 'Select Service & Date'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
