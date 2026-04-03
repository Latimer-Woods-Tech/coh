import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const PRODUCTS = [
  {
    id: '1',
    name: 'The Cipher of Healing — Course',
    price: 197,
    category: 'course',
    featured: true,
    description:
      'The full 6-station self-paced course: Transforming Trauma into Resilience. 12–18 hours of deep work. Tools, exercises, guided practices, and your Legacy Letter framework — all included.',
    detail: 'Self-paced · 6 Stations · Lifetime Access',
  },
  {
    id: '2',
    name: 'Restoration Oil — Signature Blend',
    price: 42,
    category: 'oils',
    featured: false,
    description:
      'The barbershop formulation used in every session. Beard and scalp restoration oil. When you apply it yourself, the healing continues.',
    detail: '2 fl oz · Cold-Pressed · No Sulfates',
  },
  {
    id: '3',
    name: 'Restoration Oil — Growth Formula',
    price: 38,
    category: 'oils',
    featured: false,
    description:
      'Strengthening and nourishing oil for hair and beard. A daily ritual of care made tangible.',
    detail: '2 fl oz · Cold-Pressed · Botanical Formula',
  },
  {
    id: '4',
    name: 'The Cipher of Healing — Book',
    price: 24,
    category: 'books',
    featured: false,
    description:
      'The companion text to the course. A guide to decoding the language of your own life — the code, the zero, and the circle.',
    detail: 'Hardcover · 240 pages',
  },
  {
    id: '5',
    name: 'Barbershop Grooming Kit',
    price: 89,
    category: 'kits',
    featured: false,
    description:
      'The full setup: restoration oil, edge brush, beard comb, and styling balm. To care for your appearance is not vanity — it is declaration.',
    detail: '4 Pieces · Gift-Boxed',
  },
  {
    id: '6',
    name: 'The Trigger Tracker — Journal',
    price: 18,
    category: 'books',
    featured: false,
    description:
      'The physical Trigger Tracker and Awareness Journal from Station 3. Track your responses, decode your patterns, begin to choose.',
    detail: '120 Pages · Lay-Flat Binding',
  },
  {
    id: '7',
    name: 'Styling Balm — The Factory Formula',
    price: 28,
    category: 'oils',
    featured: false,
    description:
      'Medium-hold styling balm with restorative botanicals. Finish your look. Declare your intention.',
    detail: '3 oz · Medium Hold · Matte Finish',
  },
  {
    id: '8',
    name: 'Legacy Letter Workbook',
    price: 22,
    category: 'books',
    featured: false,
    description:
      'The guided workbook for crafting your Legacy Letter and Cipher Statement from Station 6. What you pass down. What you choose to end.',
    detail: '80 Pages · Guided Prompts',
  },
];

const CATS = [
  { id: 'all',    label: 'All' },
  { id: 'course', label: 'Course' },
  { id: 'oils',   label: 'Oils & Grooming' },
  { id: 'kits',   label: 'Kits' },
  { id: 'books',  label: 'Books & Journals' },
];

export default function StorePage() {
  const [filter, setFilter] = useState('all');
  const addItem = useCartStore((state) => state.addItem);

  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

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
              <pattern id="store-circles" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="55" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="25" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#store-circles)" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative">
          <motion.p
            {...fade(0)}
            className="uppercase tracking-widest text-xs mb-5"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}
          >
            The Vault
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            Tools of Restoration
          </motion.h1>
          <motion.p
            {...fade(0.2)}
            className="text-lg max-w-2xl leading-relaxed"
            style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}
          >
            These are not retail products. They are extensions of the restoration. The outer is a
            reflection of the inner — and we choose to dress valuable because we are valuable.
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
            {CATS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className="relative px-5 py-4 transition-colors shrink-0"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  color: filter === cat.id ? '#2C1810' : '#8B5E3C',
                  fontWeight: filter === cat.id ? 600 : 400,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
                {filter === cat.id && (
                  <motion.div
                    layoutId="store-tab"
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

      <div className="max-w-5xl mx-auto px-6 py-14">

        {/* Featured card (Course) */}
        <AnimatePresence>
          {featured && (
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12 flex flex-col md:flex-row overflow-hidden"
              style={{
                backgroundColor: '#E8DCBE',
                border: '1px solid #8B5E3C',
                borderLeft: '5px solid #C9A84C',
              }}
            >
              {/* Illustration panel */}
              <div
                className="md:w-56 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: '#2C1810', minHeight: '180px' }}
              >
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="38" stroke="#C9A84C" strokeWidth="1.5" />
                  <circle cx="40" cy="40" r="28" stroke="#C9A84C" strokeWidth="1" />
                  <circle cx="40" cy="40" r="18" stroke="#C9A84C" strokeWidth="0.8" />
                  <circle cx="40" cy="40" r="4" fill="#C9A84C" />
                </svg>
              </div>
              {/* Details */}
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <p
                    className="uppercase text-xs tracking-widest mb-3"
                    style={{ fontFamily: 'DM Sans, sans-serif', color: '#8B5E3C' }}
                  >
                    Featured · The Course
                  </p>
                  <h2
                    className="text-2xl md:text-3xl font-bold mb-3"
                    style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}
                  >
                    {featured.name}
                  </h2>
                  <p
                    className="leading-relaxed mb-4"
                    style={{ fontFamily: '"Libre Baskerville", serif', fontSize: '0.95rem', color: '#3D2B1F' }}
                  >
                    {featured.description}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214' }}
                  >
                    {featured.detail}
                  </p>
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <span
                    className="text-3xl font-bold"
                    style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}
                  >
                    ${featured.price}
                  </span>
                  <button
                    onClick={() => addItem(featured as any, 1)}
                    className="px-8 py-3 uppercase text-sm tracking-widest transition-opacity hover:opacity-80"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      backgroundColor: '#C9A84C',
                      color: '#2C1810',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Add to Vault
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {rest.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex flex-col overflow-hidden"
                style={{
                  backgroundColor: '#E8DCBE',
                  border: '1px solid #8B5E3C',
                }}
              >
                {/* Sepia placeholder image */}
                <div
                  className="h-36 flex items-center justify-center"
                  style={{ backgroundColor: '#704214', filter: 'sepia(0.4) brightness(0.9) contrast(1.1)' }}
                >
                  <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>◯</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p
                    className="text-xs uppercase tracking-widest mb-2"
                    style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C' }}
                  >
                    {product.detail}
                  </p>
                  <h3
                    className="font-bold text-lg mb-3 leading-snug"
                    style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810' }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-5 flex-1"
                    style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F' }}
                  >
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span
                      className="text-xl font-bold"
                      style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}
                    >
                      ${product.price}
                    </span>
                    <button
                      onClick={() => addItem(product as any, 1)}
                      className="transition-colors"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#C9A84C',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#C9A84C')}
                      onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
                    >
                      Add to Vault →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Manifesto quote */}
        <motion.div
          {...fade(0.1)}
          className="mt-20 py-14 px-10 text-center relative overflow-hidden"
          style={{ backgroundColor: '#2C1810' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.05 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="store-quote-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#store-quote-pattern)" />
            </svg>
          </div>
          <p
            className="text-xs uppercase tracking-widest mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}
          >
            From the Manifesto
          </p>
          <blockquote
            className="text-xl md:text-2xl italic leading-relaxed max-w-3xl mx-auto mb-6"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            "When a man takes home the oil that was used in his session and applies it himself, he
            is continuing the healing. He is saying:{' '}
            <em>I am worth this care even when no one is watching.</em>"
          </blockquote>
          <p
            className="text-xs tracking-widest"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#8B5E3C', letterSpacing: '0.15em' }}
          >
            — The Cipher of Healing
          </p>
        </motion.div>

      </div>
    </div>
  );
}
