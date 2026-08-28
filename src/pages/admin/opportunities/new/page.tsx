import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AdminNewOpportunityPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    project_name: '',
    client_label: '',
    location_type: 'remote',
    location: '',
    engagement_type: 'hourly',
    budget_range: '',
    currency: 'GBP',
    estimated_duration: '',
    start_date: '',
    deadline: '',
    required_skills: '',
    preferred_skills: '',
    deliverables_summary: '',
    priority: 'normal',
    status: 'draft',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        ...form,
        required_skills: form.required_skills ? form.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        preferred_skills: form.preferred_skills ? form.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        published_at: form.status === 'published' ? new Date().toISOString() : null,
        created_by: profile?.id,
      };

      const { data, error: insertError } = await supabase
        .from('work_opportunities')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) throw insertError;
      navigate(`/admin/opportunities/${data.id}`);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/admin/opportunities')} className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to opportunities
        </button>

        <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-6">Create Opportunity</h1>

        {saveError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{saveError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} required placeholder="e.g. Senior React Developer – Public Sector Dashboard" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={5} placeholder="Describe the opportunity, the work involved, and what you are looking for..." className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 resize-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Category *</label>
                  <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                    <option>Web Development</option><option>UX/UI Design</option><option>Testing & QA</option><option>Data & Analytics</option><option>Content & Strategy</option><option>Cybersecurity</option><option>AI & Machine Learning</option><option>Business Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Engagement Type</label>
                  <select value={form.engagement_type} onChange={(e) => handleChange('engagement_type', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                    <option value="hourly">Hourly</option><option value="daily">Day Rate</option><option value="fixed_fee">Fixed Fee</option><option value="milestone">Milestone</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Project Name</label>
                  <input type="text" value={form.project_name} onChange={(e) => handleChange('project_name', e.target.value)} placeholder="e.g. Home Office Digital Transformation" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Client Label</label>
                  <input type="text" value={form.client_label} onChange={(e) => handleChange('client_label', e.target.value)} placeholder="e.g. UK Home Office" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Location & Dates</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Location Type</label>
                <select value={form.location_type} onChange={(e) => handleChange('location_type', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                  <option value="remote">Remote</option><option value="on_site">On Site</option><option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Location (optional)</label>
                <input type="text" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="e.g. London" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => handleChange('start_date', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => handleChange('deadline', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Budget & Skills</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Budget Range</label>
                <input type="text" value={form.budget_range} onChange={(e) => handleChange('budget_range', e.target.value)} placeholder="e.g. £45-65/hr" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Estimated Duration</label>
                <input type="text" value={form.estimated_duration} onChange={(e) => handleChange('estimated_duration', e.target.value)} placeholder="e.g. 8-12 weeks" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Required Skills (comma separated)</label>
              <input type="text" value={form.required_skills} onChange={(e) => handleChange('required_skills', e.target.value)} placeholder="React, TypeScript, Tailwind CSS, Git" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Preferred Skills (comma separated)</label>
              <input type="text" value={form.preferred_skills} onChange={(e) => handleChange('preferred_skills', e.target.value)} placeholder="Next.js, D3.js, WCAG accessibility" className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Deliverables & Publishing</h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Deliverables Summary</label>
              <textarea value={form.deliverables_summary} onChange={(e) => handleChange('deliverables_summary', e.target.value)} rows={3} placeholder="List the expected deliverables..." className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 resize-none"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                  <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer">
                  <option value="draft">Draft</option><option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
              {saving ? 'Creating...' : 'Create Opportunity'}
            </button>
            <button type="button" onClick={() => navigate('/admin/opportunities')} className="px-4 py-2.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer whitespace-nowrap">Cancel</button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}