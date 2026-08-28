import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function PortalPage() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    navigate('/portal/dashboard', { replace: true });
  }, [profile, loading, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-dfp-stone-50">
      <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}