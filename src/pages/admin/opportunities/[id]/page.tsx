import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function AdminOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);

  const [form, setForm] = useState<any>();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('work_opportunities')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) { setError('Opportunity not found'); return; }
        setForm({
          ...data,
          required_skills: (data.required_skills || []).join(', '),
          preferred_skills: (data.preferred_skills || []).join(', '),
        });

        const { count } = await supabase
          .from('opportunity_applications')
          .select('id', { count: 'exact', head: true })
          .eq('opportunity_id', id);

        if (!cancelled) setApplicationCount(count || 0);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const updates: any = {
        ...form,
        required_skills: typeof form.required_skills === 'string' ? form.required_skills.split(',').map((s: string) => s.trim()).filter(Boolean) : form.required_skills,
        preferred_skills: typeof form.preferred_skills === 'string' ? form.preferred_skills.split(',').map((s: string) => s.trim()).filter(Boolean) : form.preferred_skills,
        published_at: form.status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('work_opportunities')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true);
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'published' && !form.published_at) updates.published_at = new Date().toISOString();
      if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
      if (newStatus === 'filled') updates.filled_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('work_opportunities')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      setForm((prev: any) => ({ ...prev, ...updates }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-dfp-stone-100 text-dfp-stone-500',
      published: 'bg-dfp-green-100 text-dfp-green-700',
      closed: 'bg-dfp-stone-100 text-dfp-stone-500',
      filled: 'bg-dfp-blue-100 text-dfp-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      archived: 'bg-dfp-stone-50 text-dfp-stone-400',
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

  if (error) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-dfp-stone-600 mb-4">{error}</p>
          <Link to="/admin/opportunities" className="text-sm font-medium text-dfp-green-700">Back to opportunities</Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/opportunities" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to opportunities
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${getStatusBadge(form.status)}`}>{form.status?.replace('_', ' ')}</span>
              {applicationCount > 0 && (
                <Link to={`/admin/opportunity-applications?opportunity=${id}`} className="text-xs text-dfp-blue-600 font-medium cursor-pointer">{applicationCount} application{applicationCount !== 1 ? 's' : ''}</Link>
              )}
            </div>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">{form.title || 'Untitled'}</h1>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-dfp-green-50 border border-dfp-green-100 rounded-lg text-sm text-dfp-green-700 mb-4 flex items-center gap-2">
            <i className="ri-check-line"></i> Changes saved
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">{saveError}</div>
        )}

        {/* Status actions */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 mb-6">
          <p className="text-xs font-medium text-dfp-stone-500 mb-3">Change Status</p>
          <div className="flex items-center gap-2 flex-wrap">
            {['draft', 'published', 'closed', 'filled', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={saving || form.status === s}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize cursor-pointer whitespace-nowrap transition-colors ${
                  form.status === s
                    ? 'bg-dfp-stone-800 text-white'
                    : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'
                } disabled:opacity-50`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Title</label>
                <input type="text" value={form.title || ''} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Description</label>
                <textarea value={form.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={6} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 resize-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Category</label>
                  <select value={form.category || ''} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                    <option>Web Development</option><option>UX/UI Design</option><option>Testing & QA</option><option>Data & Analytics</option><option>Content & Strategy</option><option>Cybersecurity</option><option>AI & Machine Learning</option><option>Business Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Budget Range</label>
                  <input type="text" value={form.budget_range || ''} onChange={(e) => handleChange('budget_range', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Skills</h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Required Skills (comma separated)</label>
              <input type="text" value={form.required_skills || ''} onChange={(e) => handleChange('required_skills', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Preferred Skills (comma separated)</label>
              <input type="text" value={form.preferred_skills || ''} onChange={(e) => handleChange('preferred_skills', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}