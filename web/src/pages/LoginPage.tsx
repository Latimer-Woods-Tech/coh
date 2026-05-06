import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-16 px-4"
      style={{ backgroundColor: '#2C1810' }}
    >
      {/* Aaron Douglas concentric circle bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, transparent 28%, rgba(201,168,76,0.05) 28%, rgba(201,168,76,0.05) 28.5%, transparent 28.5%), radial-gradient(circle at 50% 50%, transparent 48%, rgba(201,168,76,0.03) 48%, rgba(201,168,76,0.03) 48.5%, transparent 48.5%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Cipher mark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-12 h-12 rounded-full border flex items-center justify-center"
            style={{ borderColor: '#C9A84C' }}
          >
            <div
              className="w-7 h-7 rounded-full border flex items-center justify-center"
              style={{ borderColor: '#C9A84C' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
            </div>
          </div>
        </div>

        <div
          className="p-10"
          style={{ backgroundColor: '#3D2B1F', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <div className="text-center mb-8">
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: '#F5ECD7',
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Return to the Chair
            </h1>
            <p
              className="mt-3 italic"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#8B5E3C',
                fontSize: '14px',
              }}
            >
              Sign in to continue your work.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 text-sm"
                style={{
                  backgroundColor: 'rgba(160, 82, 45, 0.15)',
                  border: '1px solid #A0522D',
                  color: '#E8DCBE',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {error}
              </motion.div>
            )}

            <div>
              <label
                className="block text-xs uppercase tracking-widest mb-2"
                style={{ fontFamily: '"DM Sans", sans-serif', color: '#8B5E3C', letterSpacing: '0.15em' }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 outline-none transition-colors"
                style={{
                  fontFamily: '"Libre Baskerville", Georgia, serif',
                  backgroundColor: '#2C1810',
                  border: '1px solid #704214',
                  color: '#F5ECD7',
                  fontSize: '15px',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#704214')}
              />
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-widest mb-2"
                style={{ fontFamily: '"DM Sans", sans-serif', color: '#8B5E3C', letterSpacing: '0.15em' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 outline-none transition-colors"
                style={{
                  fontFamily: '"Libre Baskerville", Georgia, serif',
                  backgroundColor: '#2C1810',
                  border: '1px solid #704214',
                  color: '#F5ECD7',
                  fontSize: '15px',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#704214')}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 uppercase tracking-widest text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                backgroundColor: '#C9A84C',
                color: '#2C1810',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.12em',
              }}
            >
              {isLoading ? 'Entering…' : 'Enter the Cipher'}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
            <p style={{ fontFamily: '"DM Sans", sans-serif', color: '#704214', fontSize: '13px' }}>
              No account yet?{' '}
              <Link
                to="/signup"
                style={{ color: '#C9A84C', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Create one
              </Link>
              {' '}· or{' '}
              <Link
                to="/booking"
                style={{ color: '#C9A84C', textDecoration: 'none' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
              >
                book your first session
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
