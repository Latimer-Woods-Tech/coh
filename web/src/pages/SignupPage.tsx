import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useState } from 'react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const signup = useAuthStore((state) => state.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password, name);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please try again.';
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

        <div className="text-center mb-8">
          <h1
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F5ECD7',
              fontSize: '2rem',
              lineHeight: 1.2,
            }}
          >
            Enter the Cipher
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#8B5E3C',
              fontSize: '14px',
            }}
          >
            Create your account to begin the work.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#FCA5A5',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#C9A84C' }}
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-3 rounded-lg outline-none transition-all"
              style={{
                backgroundColor: 'rgba(245, 236, 215, 0.08)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#F5ECD7',
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '15px',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.3)')}
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#C9A84C' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg outline-none transition-all"
              style={{
                backgroundColor: 'rgba(245, 236, 215, 0.08)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#F5ECD7',
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '15px',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.3)')}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#C9A84C' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg outline-none transition-all"
              style={{
                backgroundColor: 'rgba(245, 236, 215, 0.08)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#F5ECD7',
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '15px',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.3)')}
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#C9A84C' }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg outline-none transition-all"
              style={{
                backgroundColor: 'rgba(245, 236, 215, 0.08)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#F5ECD7',
                fontFamily: '"Libre Baskerville", Georgia, serif',
                fontSize: '15px',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.7)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.3)')}
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3"
            style={{ fontSize: '13px', letterSpacing: '0.1em', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Creating account…' : 'Begin the Journey'}
          </button>
        </form>

        <p
          className="mt-8 text-center"
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: '#8B5E3C',
            fontSize: '13px',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#C9A84C', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Sign in
          </Link>
        </p>

        <p
          className="mt-4 text-center text-xs"
          style={{ fontFamily: '"DM Sans", sans-serif', color: '#4A2C0E', lineHeight: 1.6 }}
        >
          This platform is restorative and educational, not therapy.
          <br />
          <Link to="/disclaimer" style={{ color: '#704214', textDecoration: 'underline' }}>
            Read the full disclaimer
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
