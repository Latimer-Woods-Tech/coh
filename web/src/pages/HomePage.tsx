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
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-dark-50 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-medium mb-6">
              ✨ Transform Your Inner World Outward
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-bold text-dark-900 mb-6 leading-tight">
              The Outer is a Reflection of the Inner
            </h1>
            <p className="text-xl md:text-3xl text-dark-700 mb-8 font-light max-w-3xl mx-auto">
              Unlock your potential through consciousness, healing, and personal transformation
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pb-8">
            <Link to="/booking" className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-2xl transition">
              Start Your Journey
            </Link>
            <Link to="/academy" className="btn btn-outline text-lg px-8 py-4 border-2 hover:bg-primary-50 transition">
              Begin Learning
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center gap-8 text-sm text-dark-600 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-primary-500 text-xl">★</span>
              5000+ Students Transformed
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-500 text-xl">★</span>
              15+ Years of Experience
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-500 text-xl">★</span>
              98% Satisfaction Rate
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Five Streams Section */}
      <section className="py-24 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-dark-900">
              Five Streams of Transformation
            </h2>
            <p className="text-xl md:text-2xl text-dark-600 max-w-2xl mx-auto">
              Discover the path that aligns with your consciousness and healing goals
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
                description: 'Personalized 1-on-1 consultations with deep healing work',
                icon: '🪑',
                link: '/booking',
                highlight: 'Most Popular',
              },
              {
                title: 'The Vault',
                description: 'Curated transformational products & tools for your journey',
                icon: '🏺',
                link: '/store',
              },
              {
                title: 'The Academy',
                description: 'Self-paced courses to master consciousness & healing',
                icon: '📚',
                link: '/academy',
                highlight: 'Best Value',
              },
              {
                title: 'The Stage',
                description: 'Live webinars & group experiences for collective growth',
                icon: '🎭',
                link: '/events',
              },
              {
                title: 'The Inner Circle',
                description: 'Exclusive VIP membership, retreats & direct access',
                icon: '💎',
                link: '/events',
                highlight: 'Premium',
              },
            ].map((stream, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -15, boxShadow: '0 25px 50px rgba(195, 155, 105, 0.15)' }}
                className="relative group cursor-pointer"
                onClick={() => (window.location.href = stream.link)}
              >
                <div className={`h-full rounded-2xl p-8 transition-all duration-300 ${
                  stream.highlight 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl' 
                    : 'bg-white border-2 border-primary-100 group-hover:border-primary-300'
                }`}>
                  {stream.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-white text-primary-600 text-xs font-bold rounded-full whitespace-nowrap">
                      {stream.highlight}
                    </div>
                  )}
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform cursor-pointer">
                    {stream.icon}
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-3">
                    {stream.title}
                  </h3>
                  <p className={`text-sm leading-relaxed mb-6 font-medium ${
                    stream.highlight ? 'text-white/90' : 'text-dark-600'
                  }`}>
                    {stream.description}
                  </p>
                  <div className={`text-sm font-bold transition-all duration-300 ${
                    stream.highlight ? 'text-white' : 'text-primary-600 group-hover:text-primary-700'
                  }`}>
                    Explore →
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-dark-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-dark-900">
              Transformations From Our Community
            </h2>
            <p className="text-xl text-dark-700">
              Real stories from people like you who've experienced profound healing
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                quote: "This journey transformed not just my mind, but my entire reality. I feel like a completely different person.",
                author: "Sarah M.",
                role: "Academy Student",
                rating: 5,
              },
              {
                quote: "The consultations provided clarity I've been searching for years. Truly life-changing work.",
                author: "James K.",
                role: "1-on-1 Client",
                rating: 5,
              },
              {
                quote: "The products in the Vault are incredible. Each one has brought such depth to my practice.",
                author: "Elena R.",
                role: "Store Customer",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-primary-500 text-xl">★</span>
                  ))}
                </div>
                <p className="text-dark-800 text-lg mb-6 font-light italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-primary-100 pt-4">
                  <p className="font-serif font-bold text-dark-900">{testimonial.author}</p>
                  <p className="text-primary-600 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Results/Impact Section */}
      <section className="py-24 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-dark-900">
              Measurable Impact & Results
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { number: '5000+', label: 'Students Transformed' },
              { number: '15+', label: 'Years of Experience' },
              { number: '98%', label: 'Satisfaction Rate' },
              { number: '4.9/5', label: 'Average Rating' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-serif font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <p className="text-dark-700 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
            Your Transformation Begins Now
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-primary-100 font-light">
            Join thousands who've discovered their inner truth and outer manifestation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn bg-white text-primary-600 hover:bg-dark-50 text-lg px-8 py-4">
              Book a Consultation
            </Link>
            <Link to="/academy" className="btn border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-4">
              Explore Academy
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
