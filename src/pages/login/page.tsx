import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/portal';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (message.includes('Invalid login credentials')) {
        setError('The email or password you entered is incorrect.');
      } else if (message.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-dfp-stone-50">
      <div className="hidden lg:flex lg:w-5/12 bg-dfp-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dfp-blue-700/90 to-dfp-blue-900/95" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                <span className="text-lg font-bold font-display tracking-tight">DFP</span>
              </div>
              <span className="text-sm font-medium text-white/80">Digital Footprint</span>
            </Link>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-semibold leading-tight">Freelancer Network</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Access approved project opportunities across software, design, testing, research, and digital services.
            </p>
          </div>
          <div className="flex items-center gap-3 text-white/40 text-xs">
            <span className="w-8 h-px bg-white/20" />
            <span>Secure Portal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-dfp-blue-800 flex items-center justify-center">
                <span className="text-sm font-bold text-white font-display">DFP</span>
              </div>
              <span className="text-xs font-medium text-dfp-stone-500">Digital Footprint</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-display font-semibold text-dfp-stone-900">Welcome back</h1>
            <p className="mt-1 text-sm text-dfp-stone-500">Sign in to your freelancer account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-dfp-stone-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-dfp-blue-600 hover:text-dfp-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dfp-stone-400 hover:text-dfp-stone-600"
                >
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-dfp-green-600 hover:bg-dfp-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-dfp-stone-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-dfp-blue-600 hover:text-dfp-blue-700 font-medium">
              Apply to join
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}