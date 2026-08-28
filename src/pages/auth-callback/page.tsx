import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/portal', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dfp-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-dfp-green-500/20 border-t-dfp-green-600 rounded-full animate-spin" />
        <p className="text-sm text-dfp-stone-500">Completing authentication...</p>
      </div>
    </div>
  );
}