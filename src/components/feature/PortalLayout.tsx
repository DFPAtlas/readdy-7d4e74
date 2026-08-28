import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

interface PortalLayoutProps {
  children: React.ReactNode;
  sidebarItems: {
    label: string;
    href: string;
    icon: string;
    badge?: string | number;
    comingSoon?: boolean;
  }[];
  role: string;
}

export default function PortalLayout({ children, sidebarItems, role }: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load profile photo
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const loadPhoto = async () => {
      const { data: fp } = await supabase
        .from('freelancer_profiles')
        .select('profile_photo_url')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (cancelled || !fp?.profile_photo_url) return;
      const { data: signed } = await supabase.storage
        .from('freelancer-avatars')
        .createSignedUrl(fp.profile_photo_url, 86400);
      if (!cancelled && signed?.signedUrl) {
        setPhotoUrl(signed.signedUrl);
      }
    };
    loadPhoto();
    return () => { cancelled = true; };
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusBadge = () => {
    if (!profile) return null;
    switch (profile.account_status) {
      case 'active': return { label: 'Active', color: 'bg-dfp-green-100 text-dfp-green-700' };
      case 'suspended': return { label: 'Suspended', color: 'bg-red-100 text-red-700' };
      default: return { label: profile.account_status || 'Unknown', color: 'bg-dfp-stone-100 text-dfp-stone-600' };
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'pending_freelancer': return 'Pending Freelancer';
      case 'freelancer': return 'Approved Freelancer';
      case 'super_admin': return 'Super Admin';
      case 'dfp_admin': return 'DFP Admin';
      case 'project_manager': return 'Project Manager';
      case 'finance': return 'Finance';
      default: return role;
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-dfp-stone-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-dfp-stone-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar header */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-dfp-stone-100 flex-shrink-0">
          <Link to="/portal" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dfp-green-600 flex items-center justify-center flex-shrink-0">
              <i className="ri-shield-check-line text-white text-sm"></i>
            </div>
            <span className="font-display font-semibold text-sm text-dfp-stone-900 whitespace-nowrap">DFP Portal</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-dfp-stone-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-dfp-stone-500">{getRoleLabel()}</span>
            {statusBadge && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  {item.comingSoon ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dfp-stone-400 cursor-not-allowed">
                      <i className={`${item.icon} text-base w-5 text-center`}></i>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-dfp-stone-100 text-dfp-stone-400 whitespace-nowrap">Later</span>
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-dfp-green-50 text-dfp-green-700 font-medium'
                          : 'text-dfp-stone-600 hover:bg-dfp-stone-50 hover:text-dfp-stone-900'
                      }`}
                    >
                      <i className={`${item.icon} text-base w-5 text-center`}></i>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700 whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-3 border-t border-dfp-stone-100 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dfp-stone-500 hover:bg-dfp-stone-50 hover:text-dfp-stone-700 transition-colors w-full cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-base w-5 text-center"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-dfp-stone-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-dfp-stone-600 hover:bg-dfp-stone-100 cursor-pointer"
            >
              <i className={`text-lg ${sidebarOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications placeholder */}
            <Link
              to="/portal"
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-dfp-stone-500 hover:bg-dfp-stone-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <i className="ri-notification-3-line text-lg"></i>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-dfp-green-500"></span>
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-dfp-stone-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-dfp-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-dfp-green-700">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-dfp-stone-700">{profile?.first_name} {profile?.last_name}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-dfp-stone-200 shadow-lg z-20 py-1">
                    <div className="px-4 py-2.5 border-b border-dfp-stone-100">
                      <p className="text-sm font-medium text-dfp-stone-900">{profile?.first_name} {profile?.last_name}</p>
                      <p className="text-xs text-dfp-stone-500">{profile?.email}</p>
                    </div>
                    <Link to="/portal/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dfp-stone-600 hover:bg-dfp-stone-50 transition-colors">
                      <i className="ri-user-settings-line"></i> Profile Settings
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dfp-stone-600 hover:bg-dfp-stone-50 transition-colors w-full text-left cursor-pointer">
                      <i className="ri-logout-box-r-line"></i> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}