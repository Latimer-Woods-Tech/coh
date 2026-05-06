import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrackedLink as Link } from '@/components/TrackedLink';
import { useCartStore } from '@/stores/cart';
import { storeApi } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  featured?: boolean;
  detail?: string;
}

interface Category {
  id: string;
  label: string;
  name?: string;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  const [filter, setFilter] = useState('all');
  const addItem = useCartStore((state) => state.addItem);
  const [searchParams] = useSearchParams();
  const checkoutStatus = searchParams.get('checkout') as 'success' | 'cancelled' | null;

  // Load products and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setProductsLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          storeApi.listProducts(),
          storeApi.listCategories(),
        ]);

        const prods = (productsData as unknown as Product[]) || [];
        const cats = (categoriesData as unknown as any[]) || [];

        // Transform categories to match UI format
        const transformedCats: Category[] = [
          { id: 'all', label: 'All' },
          ...cats.map((c) => ({ id: c.id, label: c.name || c.label })),
        ];

        setProducts(prods);
        setCategories(transformedCats);
        setProductsError(null);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load products';
        setProductsError(msg);
        console.error('Failed to load products:', err);
        
        // Fallback to empty state
        setProducts([]);
        setCategories([{ id: 'all', label: 'All' }]);
      } finally {
        setProductsLoading(false);
      }
    };

    loadData();
  }, []);

  const filtered = filter === 'all' ? products : products.filter((p) => p.categoryId === filter);
  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>

      {/* Stripe redirect banners */}
      {checkoutStatus === 'success' && (
        <div
          className="px-6 py-4 text-sm font-medium text-center"
          style={{ backgroundColor: '#2d6a4f', color: '#d8f3dc', fontFamily: '"DM Sans", sans-serif' }}
        >
          ✓ Order confirmed. Check your email for a receipt. &nbsp;
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
          Payment was not completed. Your cart items are still available.
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

      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Ritual Tools',
              body: 'Use grooming and restoration products to make care tactile, repeatable, and embodied.',
            },
            {
              title: 'Reflective Tools',
              body: 'Use books and journals when you need language, prompts, and structure outside the appointment.',
            },
            {
              title: 'Carry the Work Home',
              body: 'The Vault exists to extend the restoration beyond the chair, not to behave like generic merchandise.',
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
        <div className="max-w-5xl mx-auto px-6 mt-8">
          <Link to="/books" className="btn btn-outline" style={{ fontSize: '13px' }}>
            Explore the Books Pathway
          </Link>
        </div>
      </section>

      {/* Filter tabs */}
      <div
        className="border-b sticky top-16 z-10"
        style={{ backgroundColor: '#F5ECD7', borderColor: '#8B5E3C' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {categories.map((cat) => (
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

        {/* Loading state */}
        {productsLoading && (
          <motion.div
            {...fade()}
            className="text-center py-12"
            style={{
              fontFamily: '"Libre Baskerville", serif',
              color: '#704214',
            }}
          >
            Loading the vault...
          </motion.div>
        )}

        {/* Error state */}
        {productsError && (
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
            {productsError}
          </motion.div>
        )}

        {!productsLoading && products.length === 0 && !productsError && (
          <motion.div
            {...fade()}
            className="text-center py-12"
            style={{
              fontFamily: '"Libre Baskerville", serif',
              color: '#704214',
            }}
          >
            No products available at this time.
          </motion.div>
        )}

        {!productsLoading && products.length > 0 && (
          <>
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
                        style={{
                          fontFamily: '"Libre Baskerville", serif',
                          fontSize: '0.95rem',
                          color: '#3D2B1F',
                        }}
                      >
                        {featured.description}
                      </p>
                      {featured.detail && (
                        <p
                          className="text-xs"
                          style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: '#704214',
                          }}
                        >
                          {featured.detail}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-6">
                      <span
                        className="text-3xl font-bold"
                        style={{ fontFamily: 'DM Sans, sans-serif', color: '#2C1810' }}
                      >
                        ${featured.price}
                      </span>
                      <button
                        onClick={() => {
                          trackEvent('store_add_to_cart_clicked', {
                            productId: featured.id,
                            productName: featured.name,
                            categoryId: featured.categoryId,
                            placement: 'featured',
                          });
                          addItem(featured, 1);
                        }}
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
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-40 object-cover"
                        style={{
                          filter:
                            'sepia(0.45) contrast(1.12) brightness(0.78) saturate(0.65)',
                        }}
                      />
                    ) : (
                      <div
                        className="h-40 flex items-center justify-center"
                        style={{ backgroundColor: '#704214' }}
                      >
                        <span style={{ fontSize: '2.5rem', opacity: 0.4 }}>◯</span>
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      {product.detail && (
                        <p
                          className="text-xs uppercase tracking-widest mb-2"
                          style={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            color: '#8B5E3C',
                          }}
                        >
                          {product.detail}
                        </p>
                      )}
                      <h3
                        className="font-bold text-lg mb-3 leading-snug"
                        style={{
                          fontFamily: '"Playfair Display", serif',
                          color: '#2C1810',
                        }}
                      >
                        {product.name}
                      </h3>
                      <p
                        className="text-sm leading-relaxed mb-5 flex-1"
                        style={{
                          fontFamily: '"Libre Baskerville", serif',
                          color: '#3D2B1F',
                        }}
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
                          onClick={() => {
                            trackEvent('store_add_to_cart_clicked', {
                              productId: product.id,
                              productName: product.name,
                              categoryId: product.categoryId,
                              placement: 'grid',
                            });
                            addItem(product, 1);
                          }}
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
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.textDecorationColor = '#C9A84C')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.textDecorationColor = 'transparent')
                          }
                        >
                          Add to Vault →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Manifesto quote */}
        <motion.div
          {...fade(0.1)}
          className="mt-20 py-14 px-10 text-center relative overflow-hidden"
          style={{ backgroundColor: '#2C1810' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ opacity: 0.05 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="store-quote-pattern"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#C9A84C" strokeWidth="0.6" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#store-quote-pattern)" />
            </svg>
          </div>
          <p
            className="text-xs uppercase tracking-widest mb-6"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#C9A84C',
              letterSpacing: '0.25em',
            }}
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
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: '#8B5E3C',
              letterSpacing: '0.15em',
            }}
          >
            — The Cipher of Healing
          </p>
        </motion.div>

      </div>
    </div>
  );
}
