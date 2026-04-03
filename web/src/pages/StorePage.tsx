import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCartStore } from '@/stores/cart';

export default function StorePage() {
  const [filter, setFilter] = useState('all');
  const addItem = useCartStore((state) => state.addItem);

  const products = [
    {
      id: '1',
      name: 'Healing Crystal Set',
      price: 49.99,
      image: '💎',
      category: 'crystals',
      description: 'Curated set of healing crystals',
    },
    {
      id: '2',
      name: 'Meditation Guide Book',
      price: 24.99,
      image: '📚',
      category: 'books',
      description: 'Comprehensive meditation guidebook',
    },
    {
      id: '3',
      name: 'Chakra Balancing Oil Set',
      price: 39.99,
      image: '🧴',
      category: 'oils',
      description: 'Essential oils for chakra alignment',
    },
    {
      id: '4',
      name: 'Yoga Mat - Premium',
      price: 89.99,
      image: '🧘',
      category: 'equipment',
      description: 'Eco-friendly premium yoga mat',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'crystals', label: 'Crystals' },
    { id: 'books', label: 'Books' },
    { id: 'oils', label: 'Oils' },
    { id: 'equipment', label: 'Equipment' },
  ];

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-serif font-bold mb-4">The Vault</h1>
          <p className="text-xl text-dark-600">
            Curated products for your healing journey
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-12 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => setFilter(cat.id)}
              className={`px-6 py-2 rounded-full border-2 transition ${
                filter === cat.id
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-dark-300 text-dark-700 hover:border-primary-500'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Products Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              className="card card-hover overflow-hidden"
            >
              <div className="bg-primary-50 h-40 flex items-center justify-center text-5xl">
                {product.image}
              </div>
              <div className="p-6">
                <h3 className="font-serif font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-dark-600 text-sm mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary-500">${product.price}</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addItem(product as any, 1)}
                    className="btn btn-primary text-sm"
                  >
                    Add
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
