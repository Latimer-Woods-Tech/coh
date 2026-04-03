import { motion } from 'framer-motion';
import { useState } from 'react';

export default function AcademyPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const courses = [
    {
      id: '1',
      title: 'Introduction to Consciousness',
      level: 'Beginner',
      lessons: 12,
      hours: '6 hours',
      price: 49.99,
      image: '🧠',
      description: 'Explore the fundamentals of consciousness and self-awareness',
    },
    {
      id: '2',
      title: 'Energy Healing Mastery',
      level: 'Intermediate',
      lessons: 20,
      hours: '12 hours',
      price: 99.99,
      image: '⚡',
      description: 'Master the techniques of energy healing and chakra balancing',
    },
    {
      id: '3',
      title: 'Advanced Meditation Practices',
      level: 'Advanced',
      lessons: 24,
      hours: '16 hours',
      price: 149.99,
      image: '🧘',
      description: 'Deep meditation techniques for spiritual transformation',
    },
    {
      id: '4',
      title: 'Healing Relationships',
      level: 'Beginner',
      lessons: 10,
      hours: '5 hours',
      price: 39.99,
      image: '❤️',
      description: 'Transform your relationships through healing and awareness',
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">The Academy</h1>
          <p className="text-xl text-dark-600">
            Learn at your own pace with our comprehensive courses
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card card-hover overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="bg-primary-50 h-32 flex items-center justify-center text-6xl">
                {course.image}
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold mb-2">{course.title}</h3>
                    <div className="flex gap-2 mb-2">
                      <span className="badge badge-primary">{course.level}</span>
                      <span className="text-sm text-dark-600">
                        {course.lessons} lessons • {course.hours}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary-500">${course.price}</div>
                </div>

                <p className="text-dark-600 mb-6">{course.description}</p>

                <button className="btn btn-primary w-full">Enroll Now</button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
        >
          {[
            { stat: '5,000+', label: 'Active Students' },
            { stat: '50+', label: 'Courses Available' },
            { stat: '95%', label: 'Satisfaction Rate' },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-serif font-bold text-primary-500 mb-2">
                {item.stat}
              </div>
              <div className="text-dark-600">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
