import { Link } from 'react-router-dom';

export default function ApplicationUnderReviewPage() {
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
          <div className="w-16 h-16 mx-auto rounded-full bg-dfp-blue-50 flex items-center justify-center">
            <i className="ri-time-line text-2xl text-dfp-blue-600" />
          </div>
          <h1 className="text-xl font-display font-semibold text-dfp-stone-900">Application under review</h1>
          <p className="text-sm text-dfp-stone-500 leading-relaxed">
            Your application is being reviewed by the DFP team. You&apos;ll receive a notification once a decision has been made. This typically takes 3-5 working days.
          </p>
          <Link to="/portal" className="inline-block text-sm font-medium text-dfp-green-600 hover:text-dfp-green-700">
            &larr; Go to portal
          </Link>
        </div>
      </div>
    </div>
  );
}