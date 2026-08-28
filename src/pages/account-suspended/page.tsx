import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function AccountSuspendedPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-dfp-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-dfp-blue-800 flex items-center justify-center">
            <span className="text-sm font-bold text-white font-display">DFP</span>
          </div>
          <span className="text-xs font-medium text-dfp-stone-500">Digital Footprint</span>
        </Link>

        <div className="bg-white rounded-xl border border-dfp-stone-200 p-6 md:p-8 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <i className="ri-error-warning-line text-2xl text-amber-500" />
          </div>
          <h1 className="text-xl font-display font-semibold text-dfp-stone-900">Account suspended</h1>
          <p className="text-sm text-dfp-stone-500 leading-relaxed">
            Your account has been temporarily suspended. Please contact the DFP team for more information or to request a review.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/portal/support" className="py-2.5 px-4 bg-dfp-green-600 hover:bg-dfp-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
              Contact support
            </Link>
            <button onClick={() => signOut()} className="py-2.5 px-4 border border-dfp-stone-200 hover:bg-dfp-stone-100 text-dfp-stone-600 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}