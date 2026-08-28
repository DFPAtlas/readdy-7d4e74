import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

const adminSidebar = [
  { label: 'Overview', href: '/admin', icon: 'ri-dashboard-line' },
  { label: 'Applications', href: '/admin/applications', icon: 'ri-file-list-3-line' },
  { label: 'Opportunities', href: '/admin/opportunities', icon: 'ri-briefcase-line' },
  { label: 'Applications Review', href: '/admin/opportunity-applications', icon: 'ri-user-star-line' },
  { label: 'Invitations', href: '/admin/invitations', icon: 'ri-mail-send-line' },
  { label: 'Assignments', href: '/admin/assignments', icon: 'ri-list-check-3' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line', comingSoon: true },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

export default function AdminInvitationsPage() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invitations' | 'offers'>('invitations');

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invRes, offRes] = await Promise.all([
          supabase.from('freelancer_invitations').select('*').order('created_at', { ascending: false }),
          supabase.from('assignment_offers').select('*').order('created_at', { ascending: false }),
        ]);
        if (cancelled) return;

        const invData = invRes.data || [];
        const offData = offRes.data || [];

        const allUserIds = [...new Set([
          ...invData.map((i: any) => i.freelancer_id),
          ...offData.map((o: any) => o.freelancer_id),
        ])];

        if (allUserIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', allUserIds);
          if (!cancelled) {
            const profileMap: Record<string, any> = {};
            (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });
            setInvitations(invData.map((i: any) => ({ ...i, profile: profileMap[i.freelancer_id] || null })));
            setOffers(offData.map((o: any) => ({ ...o, profile: profileMap[o.freelancer_id] || null })));
          }
        } else {
          setInvitations([]);
          setOffers([]);
        }
      } catch (err: any) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-dfp-green-100 text-dfp-green-700',
      declined: 'bg-red-100 text-red-700',
      expired: 'bg-dfp-stone-100 text-dfp-stone-400',
      cancelled: 'bg-dfp-stone-100 text-dfp-stone-400',
      retracted: 'bg-dfp-stone-100 text-dfp-stone-400',
    };
    return map[status] || 'bg-dfp-stone-100 text-dfp-stone-500';
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Invitations &amp; Offers</h1>
          <p className="text-sm text-dfp-stone-500 mt-1">Manage direct invitations and assignment offers to freelancers</p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-6 bg-dfp-stone-50 rounded-full p-1 w-fit">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${activeTab === 'invitations' ? 'bg-white text-dfp-stone-900 shadow-sm' : 'text-dfp-stone-500 hover:text-dfp-stone-700'}`}
          >
            Invitations ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${activeTab === 'offers' ? 'bg-white text-dfp-stone-900 shadow-sm' : 'text-dfp-stone-500 hover:text-dfp-stone-700'}`}
          >
            Offers ({offers.length})
          </button>
        </div>

        {activeTab === 'invitations' && (
          invitations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
              <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-send-line text-2xl text-dfp-stone-300"></i>
              </div>
              <p className="text-sm text-dfp-stone-500">No invitations sent yet</p>
              <p className="text-xs text-dfp-stone-400 mt-1">Invite freelancers directly from their profile or from an opportunity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dfp-stone-900">{inv.profile?.first_name} {inv.profile?.last_name}</p>
                    <p className="text-xs text-dfp-stone-400">{inv.profile?.email} · {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'offers' && (
          offers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
              <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-text-line text-2xl text-dfp-stone-300"></i>
              </div>
              <p className="text-sm text-dfp-stone-500">No offers sent yet</p>
              <p className="text-xs text-dfp-stone-400 mt-1">Offers are created when you accept a freelancer application or send a direct offer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dfp-stone-900">{offer.title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(offer.status)}`}>{offer.status}</span>
                    </div>
                    {offer.offered_rate && (
                      <span className="text-xs font-medium text-dfp-stone-600">{offer.currency} {offer.offered_rate} / {offer.engagement_type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-dfp-stone-400">
                    <span>{offer.profile?.first_name} {offer.profile?.last_name}</span>
                    {offer.start_date && <span>Start: {new Date(offer.start_date).toLocaleDateString()}</span>}
                    {offer.deadline && <span>Deadline: {new Date(offer.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </PortalLayout>
  );
}