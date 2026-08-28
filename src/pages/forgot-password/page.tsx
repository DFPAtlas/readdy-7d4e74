import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError('Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dfp-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-dfp-blue-800 flex items-center justify-center">
              <span className="text-sm font-bold text-white font-display">DFP</span>
            </div>
            <span className="text-xs font-medium text-dfp-stone-500">Digital Footprint</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-dfp-stone-200 p-6 md:p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-dfp-green-50 flex items-center justify-center">
                <i className="ri-mail-check-line text-2xl text-dfp-green-600" />
              </div>
              <h1 className="text-xl font-display font-semibold text-dfp-stone-900">Check your email</h1>
              <p className="text-sm text-dfp-stone-500 leading-relaxed">
                If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="inline-block mt-4 text-sm font-medium text-dfp-blue-600 hover:text-dfp-blue-700">
                &larr; Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-display font-semibold text-dfp-stone-900 mb-1">Reset your password</h1>
              <p className="text-sm text-dfp-stone-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

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
                  <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="you@example.com" />
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-dfp-green-600 hover:bg-dfp-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-dfp-stone-500">
                <Link to="/login" className="text-dfp-blue-600 hover:text-dfp-blue-700 font-medium">
                  &larr; Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}