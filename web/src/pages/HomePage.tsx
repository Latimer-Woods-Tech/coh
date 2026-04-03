import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-dark-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-primary-300 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-dark-900 mb-4">
              The Outer is a Reflection of the Inner
            </h1>
            <p className="text-xl md:text-2xl text-dark-700 mb-8">
              Healing, learning, and transformation through consciousness.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn btn-primary text-lg">
              Book Consultation
            </Link>
            <Link to="/academy" className="btn btn-outline text-lg">
              Explore Academy
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Five Streams Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Five Streams of Healing
            </h2>
            <p className="text-xl text-dark-600">
              Choose the path that resonates with your journey
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                title: 'The Chair',
                description: 'One-on-one consultations and personalized guidance',
                icon: '🪑',
                link: '/booking',
              },
              {
                title: 'The Vault',
                description: 'Curated products for your healing journey',
                icon: '🏺',
                link: '/store',
              },
              {
                title: 'The Academy',
                description: 'Learn at your own pace with comprehensive courses',
                icon: '📚',
                link: '/academy',
              },
              {
                title: 'The Stage',
                description: 'Live webinars and group experiences',
                icon: '🎭',
                link: '/events',
              },
              {
                title: 'The Inner Circle',
                description: 'Exclusive membership community and retreats',
                icon: '💎',
                link: '/events',
              },
            ].map((stream, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="card card-hover p-6 text-center cursor-pointer group"
                onClick={() => (window.location.href = stream.link)}
              >
                <div className="text-5xl mb-4">{stream.icon}</div>
                <h3 className="text-xl font-serif font-bold mb-3 group-hover:text-primary-500 transition">
                  {stream.title}
                </h3>
                <p className="text-dark-600 text-sm">{stream.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Our practitioners are ready to support your transformation
            </p>
            <Link to="/booking" className="btn bg-white text-primary-600 hover:bg-dark-50">
              Start Your Healing Today
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
