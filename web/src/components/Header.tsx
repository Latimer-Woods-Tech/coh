import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { label: 'The Chair',   path: '/booking' },
  { label: 'The Vault',   path: '/store'   },
  { label: 'The Academy', path: '/academy' },
  { label: 'The Stage',   path: '/events'  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const location = useLocation();

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'rgba(44, 24, 16, 0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-18 py-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            {/* Cipher mark — concentric circle glyph */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border"
              style={{ borderColor: '#C9A84C', background: 'transparent' }}
            >
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center"
                style={{ borderColor: '#C9A84C' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
              </div>
            </div>
            <div>
              <span
                className="block font-bold tracking-wide leading-none"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#F5ECD7',
                  fontSize: '17px',
                  letterSpacing: '0.04em',
                }}
              >
                CypherOfHealing
              </span>
              <span
                className="block"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: '#8B5E3C',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginTop: '1px',
                }}
              >
                The Factory · 2026
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(({ label, path }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: active ? '#C9A84C' : '#E8DCBE',
                    borderBottom: active ? '1px solid #C9A84C' : '1px solid transparent',
                    paddingBottom: '2px',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#C9A84C';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.color = '#E8DCBE';
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-5">
            {/* Cart */}
            <Link to="/store" className="relative" aria-label="Cart">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="#E8DCBE"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {cartItems.length > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#C9A84C',
                    color: '#2C1810',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '12px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#C9A84C',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                    className="hidden sm:block hover:opacity-80 transition-opacity"
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#8B5E3C',
                  }}
                  className="hidden sm:block hover:opacity-70 transition-opacity"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:block btn-primary btn"
                style={{ padding: '0.5rem 1.25rem', fontSize: '12px' }}
              >
                Begin Your Session
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="#E8DCBE" strokeWidth={1.5} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}
            >
              <div className="py-4 flex flex-col gap-1">
                {NAV.map(({ label, path }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className="py-3 px-2 transition-colors"
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '13px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: location.pathname === path ? '#C9A84C' : '#E8DCBE',
                      borderBottom: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    {label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-3 btn btn-primary text-center"
                    style={{ fontSize: '12px' }}
                  >
                    Begin Your Session
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

