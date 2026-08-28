import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function ResetPasswordPage() {
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, navigate, loading]);

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

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError('Unable to reset password. The link may have expired.');
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
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-dfp-green-50 flex items-center justify-center">
                <i className="ri-check-line text-2xl text-dfp-green-600" />
              </div>
              <h1 className="text-xl font-display font-semibold text-dfp-stone-900">Password updated</h1>
              <p className="text-sm text-dfp-stone-500">Your password has been reset. Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-display font-semibold text-dfp-stone-900 mb-1">Set new password</h1>
              <p className="text-sm text-dfp-stone-500 mb-6">Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                    New password
                  </label>
                  <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="At least 8 characters" />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="Re-enter your password" />
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-dfp-green-600 hover:bg-dfp-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer">
                  {loading ? 'Updating...' : 'Set new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}