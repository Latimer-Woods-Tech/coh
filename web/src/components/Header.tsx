import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { motion } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow transform group-hover:scale-105">
              <span className="text-white font-serif font-bold text-xl">✨</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-xl text-dark-900 block">Cypher of Healing</span>
              <span className="text-xs text-primary-600 font-medium">Transform Within</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/booking" className="text-dark-700 hover:text-primary-600 font-medium transition relative group">
              Booking
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-primary-500 transition-all group-hover:w-full rounded-full"></span>
            </Link>
            <Link to="/store" className="text-dark-700 hover:text-primary-600 font-medium transition relative group">
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-primary-500 transition-all group-hover:w-full rounded-full"></span>
            </Link>
            <Link to="/academy" className="text-dark-700 hover:text-primary-600 font-medium transition relative group">
              Academy
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-primary-500 transition-all group-hover:w-full rounded-full"></span>
            </Link>
            <Link to="/events" className="text-dark-700 hover:text-primary-600 font-medium transition relative group">
              Events
              <span className="absolute bottom-0 left-0 w-0 h-1 bg-primary-500 transition-all group-hover:w-full rounded-full"></span>
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            {/* Cart */}
            <Link
              to="/store"
              className="relative p-2 text-dark-700 hover:text-primary-600 transition hover:scale-110"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8m10 0l2-8m0 0h6"
                />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-dark-700 font-medium">Welcome, {user.name?.split(' ')[0]}</span>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="text-sm text-dark-700 hover:text-primary-600 transition font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden sm:inline-block text-sm font-bold text-primary-600 hover:text-primary-700 transition relative group"
              >
                Sign In
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full rounded-full"></span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-dark-700 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pb-4 flex flex-col gap-4"
          >
            <Link to="/booking" className="text-dark-700 hover:text-primary-600 font-medium">
              Booking
            </Link>
            <Link to="/store" className="text-dark-700 hover:text-primary-500">
              Shop
            </Link>
            <Link to="/academy" className="text-dark-700 hover:text-primary-500">
              Academy
            </Link>
            <Link to="/events" className="text-dark-700 hover:text-primary-500">
              Events
            </Link>
          </motion.nav>
        )}
      </div>
    </header>
  );
}
