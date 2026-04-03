import { motion } from 'framer-motion';
import { useState } from 'react';

export default function EventsPage() {
  const [filter, setFilter] = useState('all');

  const events = [
    {
      id: '1',
      title: 'Full Moon Release Ceremony',
      type: 'ceremony',
      date: '2024-04-10',
      time: '7:00 PM',
      duration: '2 hours',
      attendees: 45,
      price: 29.99,
      image: '🌕',
      description: 'Join us for a powerful full moon release ceremony',
    },
    {
      id: '2',
      title: 'Group Energy Healing',
      type: 'workshop',
      date: '2024-04-15',
      time: '6:00 PM',
      duration: '1.5 hours',
      attendees: 30,
      price: 19.99,
      image: '⚡',
      description: 'Experience collective healing energy in a group setting',
    },
    {
      id: '3',
      title: 'Consciousness Summit',
      type: 'summit',
      date: '2024-05-01',
      time: '9:00 AM',
      duration: 'Full Day',
      attendees: 200,
      price: 99.99,
      image: '🎭',
      description: 'Multi-speaker summit on consciousness and healing',
    },
    {
      id: '4',
      title: 'Retreat Weekend',
      type: 'retreat',
      date: '2024-05-17',
      time: 'Friday-Sunday',
      duration: '3 days',
      attendees: 50,
      price: 299.99,
      image: '🏞️',
      description: 'Immersive retreat experience in nature',
    },
  ];

  const types = [
    { id: 'all', label: 'All Events' },
    { id: 'ceremony', label: 'Ceremonies' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'summit', label: 'Summits' },
    { id: 'retreat', label: 'Retreats' },
  ];

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">The Stage & Inner Circle</h1>
          <p className="text-xl text-dark-600">
            Join us for transformative group experiences and retreats
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap gap-3">
          {types.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilter(type.id)}
              className={`px-6 py-2 rounded-full border-2 transition ${
                filter === type.id
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-dark-300 text-dark-700 hover:border-primary-500'
              }`}
            >
              {type.label}
            </motion.button>
          ))}
        </div>

        {/* Events */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filtered.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card card-hover overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8">
                <div className="flex items-center justify-center bg-primary-50 rounded-lg h-40 md:h-auto text-5xl">
                  {event.image}
                </div>

                <div className="md:col-span-2">
                  <div className="flex gap-2 mb-3">
                    <span className="badge badge-primary capitalize">{event.type}</span>
                    {event.attendees > 100 && (
                      <span className="badge badge-success">Featured</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-2">{event.title}</h3>
                  <p className="text-dark-600 mb-4">{event.description}</p>
                  <div className="space-y-1 text-sm text-dark-600">
                    <div>📅 {event.date} • {event.time}</div>
                    <div>⏱️ Duration: {event.duration}</div>
                    <div>👥 {event.attendees} attending</div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <div className="text-3xl font-bold text-primary-500">${event.price}</div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary mt-4"
                  >
                    Register
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
