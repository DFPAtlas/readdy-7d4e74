import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

const CATEGORIES = [
  'Web Development',
  'UX and UI Design',
  'Software Testing and UAT',
  'AI and Automation',
  'Data and Research',
  'Content and Documentation',
  'Cybersecurity and Technical Operations',
  'Business and Project Support',
];

const TIMEZONES = [
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Dublin',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    timezone: 'Europe/London',
    category: '',
  });
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!agreedPrivacy || !agreedTerms) {
      setError('You must agree to the Privacy Notice and Freelancer Application Terms.');
      return;
    }

    setLoading(true);

    try {
      const { user } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'pending_freelancer',
          account_status: 'active',
        });

        await supabase.from('freelancer_profiles').upsert({
          user_id: user.id,
          country: formData.country,
          timezone: formData.timezone,
          primary_category: formData.category,
        });

        await supabase.from('freelancer_applications').upsert({
          user_id: user.id,
          status: 'draft',
          profile_completion: 5,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          action: 'registration',
          entity_type: 'profile',
          entity_id: user.id,
        });
      }

      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (message.includes('already registered') || message.includes('already exists')) {
        setError('An account with this email already exists.');
      } else {
        setError('Unable to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dfp-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-dfp-blue-800 flex items-center justify-center">
              <span className="text-sm font-bold text-white font-display">DFP</span>
            </div>
            <span className="text-xs font-medium text-dfp-stone-500">Digital Footprint</span>
          </Link>
          <h1 className="mt-6 text-2xl font-display font-semibold text-dfp-stone-900">Apply to join</h1>
          <p className="mt-1 text-sm text-dfp-stone-500">Create your freelancer account to get started</p>
        </div>

        <div className="bg-white rounded-xl border border-dfp-stone-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                  First name
                </label>
                <input id="firstName" type="text" autoComplete="given-name" required value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="John" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                  Last name
                </label>
                <input id="lastName" type="text" autoComplete="family-name" required value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="Smith" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                Email address
              </label>
              <input id="email" type="email" autoComplete="email" required value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dfp-stone-400 hover:text-dfp-stone-600 cursor-pointer">
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                Confirm password
              </label>
              <input id="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="Re-enter your password" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                  Country
                </label>
                <input id="country" type="text" autoComplete="country-name" required value={formData.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 placeholder:text-dfp-stone-400 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all" placeholder="United Kingdom" />
              </div>
              <div>
                <label htmlFor="timezone" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                  Timezone
                </label>
                <select id="timezone" value={formData.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all cursor-pointer">
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
                Primary freelancer category
              </label>
              <select id="category" required value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg text-dfp-stone-900 focus:outline-none focus:ring-2 focus:ring-dfp-green-500/30 focus:border-dfp-green-400 transition-all cursor-pointer">
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-dfp-stone-300 text-dfp-green-600 focus:ring-dfp-green-500 cursor-pointer" />
                <span className="text-xs text-dfp-stone-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/privacy" className="text-dfp-blue-600 hover:underline">Privacy Notice</Link>
                  {' '}and understand how my data will be processed.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-dfp-stone-300 text-dfp-green-600 focus:ring-dfp-green-500 cursor-pointer" />
                <span className="text-xs text-dfp-stone-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/freelancer-terms" className="text-dfp-blue-600 hover:underline">Freelancer Application Terms</Link>
                  {' '}and confirm the information I provide is accurate.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-dfp-green-600 hover:bg-dfp-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-dfp-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-dfp-blue-600 hover:text-dfp-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}