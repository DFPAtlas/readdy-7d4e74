import { Link } from 'react-router-dom';

export default function UnauthorisedPage() {
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
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <i className="ri-shield-cross-line text-2xl text-red-500" />
          </div>
          <h1 className="text-xl font-display font-semibold text-dfp-stone-900">Access denied</h1>
          <p className="text-sm text-dfp-stone-500 leading-relaxed">
            You don&apos;t have permission to access this page. If you believe this is an error, please contact the DFP team.
          </p>
          <Link to="/portal" className="inline-block text-sm font-medium text-dfp-green-600 hover:text-dfp-green-700">
            &larr; Go to portal
          </Link>
        </div>
      </div>
    </div>
  );
}