import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';
import DocumentViewerModal from '@/components/feature/DocumentViewerModal';

const adminSidebar = [
  { label: 'Overview', href: '/admin', icon: 'ri-dashboard-line' },
  { label: 'Applications', href: '/admin/applications', icon: 'ri-file-list-3-line' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line', comingSoon: true },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

interface AppDetail {
  id: string;
  user_id: string;
  status: string;
  profile_completion: number;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles?: any;
  freelancer_profiles?: any;
  freelancer_business_details?: any;
  freelancer_skills?: any;
  freelancer_availability?: any;
  freelancer_rates?: any;
  documents?: any[];
  agreements?: any[];
  portfolio?: any[];
  events?: any[];
  notes?: any[];
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase.from('freelancer_applications').select('*').eq('id', id).maybeSingle();
      if (err) throw err;
      if (!data) { setError('Application not found'); return; }

      const [profileData, fpData, bizData, skillsData, availData, ratesData, docsData, agreeData, portData, eventsData, notesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user_id).maybeSingle(),
        supabase.from('freelancer_profiles').select('*').eq('user_id', data.user_id).maybeSingle(),
        supabase.from('freelancer_business_details').select('*').eq('user_id', data.user_id).maybeSingle(),
        supabase.from('freelancer_skills').select('*').eq('user_id', data.user_id).maybeSingle(),
        supabase.from('freelancer_availability').select('*').eq('user_id', data.user_id).maybeSingle(),
        supabase.from('freelancer_rates').select('*').eq('user_id', data.user_id).maybeSingle(),
        supabase.from('freelancer_documents').select('*').eq('user_id', data.user_id).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('freelancer_agreements').select('*').eq('user_id', data.user_id),
        supabase.from('freelancer_portfolio_items').select('*').eq('user_id', data.user_id).order('sort_order'),
        supabase.from('freelancer_application_events').select('*').eq('application_id', id).order('created_at', { ascending: false }),
        supabase.from('freelancer_internal_notes').select('*').eq('freelancer_id', data.user_id).order('created_at', { ascending: false }),
      ]);

      const docs = docsData.data || [];
      const reviewerIds = Array.from(new Set(docs.map((d: any) => d.reviewed_by).filter(Boolean)));
      const reviewerMap: Record<string, any> = {};
      if (reviewerIds.length > 0) {
        const { data: reviewersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', reviewerIds);
        (reviewersData || []).forEach((p: any) => { reviewerMap[p.id] = p; });
      }
      const docsWithReviewer = docs.map((d: any) => ({ ...d, reviewer: reviewerMap[d.reviewed_by] || null }));

      setApp({
        ...data,
        profiles: profileData.data,
        freelancer_profiles: fpData.data,
        freelancer_business_details: bizData.data,
        freelancer_skills: skillsData.data,
        freelancer_availability: availData.data,
        freelancer_rates: ratesData.data,
        documents: docsWithReviewer,
        agreements: agreeData.data || [],
        portfolio: portData.data || [],
        events: eventsData.data || [],
        notes: notesData.data || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleAction = async (action: string, reason?: string) => {
    if (!app || !profile) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      let eventType = '';

      switch (action) {
        case 'under_review':
          updates.status = 'under_review';
          eventType = 'status_change';
          break;
        case 'more_info':
          updates.status = 'more_info';
          eventType = 'more_info_requested';
          break;
        case 'approve':
          updates.status = 'approved';
          updates.approved_at = new Date().toISOString();
          updates.reviewed_by = profile.id;
          eventType = 'approved';
          // Update profile role
          await supabase.from('profiles').update({ role: 'freelancer', account_status: 'active' }).eq('id', app.user_id);
          break;
        case 'reject':
          updates.status = 'rejected';
          updates.rejected_at = new Date().toISOString();
          updates.rejection_reason = reason || '';
          updates.reviewed_by = profile.id;
          eventType = 'rejected';
          break;
        case 'suspend':
          updates.status = 'suspended';
          eventType = 'suspended';
          await supabase.from('profiles').update({ account_status: 'suspended' }).eq('id', app.user_id);
          break;
        default:
          break;
      }

      await supabase.from('freelancer_applications').update(updates).eq('id', app.id);

      // Create event
      await supabase.from('freelancer_application_events').insert({
        application_id: app.id,
        actor_id: profile.id,
        event_type: eventType,
        previous_status: app.status,
        new_status: updates.status,
        note: reason || null,
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: `application_${action}`,
        entity_type: 'freelancer_application',
        entity_id: app.id,
        previous_value: { status: app.status },
        new_value: { status: updates.status },
      });

      // Create notification
      await supabase.from('freelancer_notifications').insert({
        user_id: app.user_id,
        type: eventType,
        title: `Application ${action.replace(/_/g, ' ')}`,
        message: reason ? `Reason: ${reason}` : `Your application has been ${action.replace(/_/g, ' ')}.`,
        read: false,
        action_url: '/portal',
      });

      setShowRejectReason(false);
      setShowMoreInfo(false);
      setReasonInput('');
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const addNote = async () => {
    if (!app || !profile || !newNote.trim()) return;
    await supabase.from('freelancer_internal_notes').insert({
      freelancer_id: app.user_id,
      author_id: profile.id,
      content: newNote.trim(),
    });
    setNewNote('');
    fetchDetail();
  };

  const updateDocStatus = async (docId: string, status: string) => {
    if (!profile) return;
    await supabase.from('freelancer_documents').update({
      review_status: status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', docId);
    fetchDetail();
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-dfp-stone-100 text-dfp-stone-600',
      submitted: 'bg-dfp-blue-100 text-dfp-blue-700',
      under_review: 'bg-amber-100 text-amber-700',
      more_info: 'bg-orange-100 text-orange-700',
      approved: 'bg-dfp-green-100 text-dfp-green-700',
      rejected: 'bg-red-100 text-red-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-dfp-stone-100 text-dfp-stone-600';
  };

  if (loading) {
    return <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div></PortalLayout>;
  }

  if (error || !app) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Application not found'}</p>
          <Link to="/admin/applications" className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">Back to List</Link>
        </div>
      </PortalLayout>
    );
  }

  const fp = app.freelancer_profiles;
  const biz = app.freelancer_business_details;
  const skills = app.freelancer_skills;
  const avail = app.freelancer_availability;
  const rates = app.freelancer_rates;

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link to="/admin/applications" className="text-xs text-dfp-stone-500 hover:text-dfp-stone-700 mb-1 inline-block cursor-pointer">
              <i className="ri-arrow-left-line mr-1"></i> Back to Applications
            </Link>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">
              {app.profiles?.first_name} {app.profiles?.last_name}
            </h1>
            <p className="text-sm text-dfp-stone-500">{app.profiles?.email}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap capitalize ${getStatusBadge(app.status)}`}>
            {(app.status || '').replace(/_/g, ' ')}
          </span>
        </div>

        {actionError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">{actionError}</div>
        )}

        {/* Review panel */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5 mb-6">
          <h2 className="text-sm font-semibold text-dfp-stone-900 mb-3">Review Decision</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleAction('under_review')} disabled={actionLoading} className="px-4 py-2 bg-dfp-blue-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-blue-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap">
              <i className="ri-search-eye-line mr-1"></i> Mark Under Review
            </button>
            <button onClick={() => setShowMoreInfo(true)} disabled={actionLoading} className="px-4 py-2 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap">
              <i className="ri-question-line mr-1"></i> Request More Info
            </button>
            <button onClick={() => handleAction('approve')} disabled={actionLoading} className="px-4 py-2 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap">
              <i className="ri-check-line mr-1"></i> Approve
            </button>
            <button onClick={() => setShowRejectReason(true)} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap">
              <i className="ri-close-line mr-1"></i> Reject
            </button>
            <button onClick={() => handleAction('suspend')} disabled={actionLoading} className="px-4 py-2 bg-dfp-stone-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-stone-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap">
              <i className="ri-forbid-line mr-1"></i> Suspend
            </button>
          </div>

          {/* Reject reason dialog */}
          {showRejectReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <label className="block text-xs font-medium text-red-700 mb-1.5">Rejection reason (required)</label>
              <textarea value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white resize-none" placeholder="Explain why this application is being rejected..."></textarea>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleAction('reject', reasonInput)} disabled={!reasonInput.trim() || actionLoading} className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer">Confirm Reject</button>
                <button onClick={() => { setShowRejectReason(false); setReasonInput(''); }} className="px-4 py-1.5 text-xs text-dfp-stone-600 hover:text-dfp-stone-800 cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {/* More info request dialog */}
          {showMoreInfo && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <label className="block text-xs font-medium text-orange-700 mb-1.5">What information is needed?</label>
              <textarea value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white resize-none" placeholder="Describe what additional information is required..."></textarea>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleAction('more_info', reasonInput)} disabled={!reasonInput.trim() || actionLoading} className="px-4 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer">Send Request</button>
                <button onClick={() => { setShowMoreInfo(false); setReasonInput(''); }} className="px-4 py-1.5 text-xs text-dfp-stone-600 hover:text-dfp-stone-800 cursor-pointer">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Application details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Details sections */}
            {[
              { title: 'Personal Details', data: [
                { l: 'Name', v: `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}` },
                { l: 'Preferred Name', v: fp?.preferred_name },
                { l: 'Telephone', v: fp?.telephone },
                { l: 'Country', v: fp?.country },
                { l: 'City/Region', v: fp?.city_region },
                { l: 'Timezone', v: fp?.timezone },
                { l: 'Languages', v: (fp?.languages || []).join(', ') },
                { l: 'Summary', v: fp?.bio, long: true },
              ]},
              { title: 'Business Details', data: [
                { l: 'Type', v: biz?.business_type },
                { l: 'Trading Name', v: biz?.trading_name },
                { l: 'Company', v: biz?.company_name },
                { l: 'VAT', v: biz?.vat_registered ? `Yes — ${biz.vat_number || 'No number'}` : 'No' },
                { l: 'Website', v: biz?.website },
              ]},
              { title: 'Skills', data: [
                { l: 'Primary Category', v: fp?.primary_category },
                { l: 'Skills', v: (skills?.skills || []).join(', ') },
                { l: 'Experience', v: fp?.experience_years ? `${fp.experience_years} years (${fp.experience_level})` : '' },
                { l: 'Tools', v: (fp?.tools_platforms || []).join(', ') },
                { l: 'Certifications', v: (fp?.certifications || []).join(', ') },
              ]},
              { title: 'Availability & Rates', data: [
                { l: 'Status', v: avail?.availability_status },
                { l: 'Hours/week', v: avail?.hours_per_week },
                { l: 'Remote/On-site', v: avail?.remote_preference },
                { l: 'Hourly Rate', v: rates?.hourly_rate ? `£${rates.hourly_rate}` : '' },
                { l: 'Day Rate', v: rates?.day_rate ? `£${rates.day_rate}` : '' },
              ]},
            ].map((section) => (
              <div key={section.title} className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
                <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3 pb-2 border-b border-dfp-stone-100">{section.title}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {section.data.map((row) => (
                    <div key={row.l} className={row.long ? 'sm:col-span-2' : ''}>
                      <dt className="text-[11px] text-dfp-stone-400">{row.l}</dt>
                      <dd className="text-sm text-dfp-stone-800">{row.v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            {/* Portfolio */}
            {app.portfolio && app.portfolio.length > 0 && (
              <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
                <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3 pb-2 border-b border-dfp-stone-100">Portfolio ({app.portfolio.length})</h3>
                <div className="space-y-2">
                  {app.portfolio.map((item: any) => (
                    <div key={item.id} className="p-3 bg-dfp-stone-50 rounded-lg">
                      <p className="text-sm font-medium text-dfp-stone-900">{item.title}</p>
                      <p className="text-xs text-dfp-stone-500">{item.project_type}{item.url ? ` · ${item.url}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agreements */}
            <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3 pb-2 border-b border-dfp-stone-100">Agreements</h3>
              {app.agreements && app.agreements.length > 0 ? (
                <div className="space-y-2">
                  {app.agreements.map((a: any) => (
                    <div key={a.agreement_type} className="flex items-center justify-between">
                      <span className="text-sm text-dfp-stone-700">{a.agreement_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.accepted ? 'bg-dfp-green-100 text-dfp-green-700' : 'bg-dfp-stone-100 text-dfp-stone-500'}`}>
                        {a.accepted ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-dfp-stone-400">No agreements recorded</p>}
            </div>

            {/* Events timeline */}
            <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3 pb-2 border-b border-dfp-stone-100">Application History</h3>
              {app.events && app.events.length > 0 ? (
                <div className="space-y-3">
                  {app.events.map((ev: any) => (
                    <div key={ev.id} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-dfp-stone-300 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <p className="text-xs text-dfp-stone-500">
                          <span className="font-medium text-dfp-stone-700 capitalize">{ev.event_type.replace(/_/g, ' ')}</span>
                          {ev.previous_status && ev.new_status && (
                            <span className="text-dfp-stone-400"> — {ev.previous_status} → {ev.new_status}</span>
                          )}
                        </p>
                        {ev.note && <p className="text-xs text-dfp-stone-400 mt-0.5">{ev.note}</p>}
                        <p className="text-[10px] text-dfp-stone-400 mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-dfp-stone-400">No events recorded</p>}
            </div>
          </div>

          {/* Sidebar: Internal notes + documents */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3">Internal Notes</h3>
              <div className="mb-3">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 bg-white resize-none" placeholder="Add an internal note..."></textarea>
                <button onClick={addNote} disabled={!newNote.trim()} className="mt-2 px-3 py-1.5 bg-dfp-stone-100 text-dfp-stone-600 text-xs font-medium rounded-lg hover:bg-dfp-stone-200 transition-colors disabled:opacity-50 cursor-pointer">Add Note</button>
              </div>
              {app.notes && app.notes.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {app.notes.map((n: any) => (
                    <div key={n.id} className="p-2.5 bg-dfp-stone-50 rounded-lg">
                      <p className="text-xs text-dfp-stone-700">{n.content}</p>
                      <p className="text-[10px] text-dfp-stone-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-dfp-stone-400">No internal notes yet</p>}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3">Documents ({app.documents?.length || 0})</h3>
              {app.documents && app.documents.length > 0 ? (
                <div className="space-y-2">
                  {app.documents.map((doc: any) => (
                    <div key={doc.id} className="p-2.5 bg-dfp-stone-50 rounded-lg">
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="flex items-center gap-2.5 min-w-0 w-full text-left group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                          <i className={`${doc.file_type?.includes('pdf') ? 'ri-file-pdf-line text-red-500' : doc.file_type?.includes('image') ? 'ri-image-line text-dfp-green-500' : 'ri-file-text-line text-dfp-stone-500'} text-sm`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-dfp-stone-700 truncate group-hover:text-dfp-green-700 transition-colors">{doc.file_name}</p>
                          <p className="text-[10px] text-dfp-stone-400 capitalize">{doc.category.replace(/_/g, ' ')} · {(doc.file_size / 1024).toFixed(0)} KB</p>
                        </div>
                        <i className="ri-eye-line text-dfp-stone-300 group-hover:text-dfp-green-600 text-sm flex-shrink-0"></i>
                      </button>
                      <div className="flex items-center gap-1.5 mt-2 pl-10">
                        {doc.review_status === 'approved' ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700 whitespace-nowrap">Approved</span>
                        ) : doc.review_status === 'rejected' ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 whitespace-nowrap">Rejected</span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 whitespace-nowrap">Pending</span>
                        )}
                        <span className="flex-1"></span>
                        {doc.review_status !== 'approved' && (
                          <button onClick={() => updateDocStatus(doc.id, 'approved')} disabled={actionLoading} className="w-6 h-6 rounded-md flex items-center justify-center text-dfp-green-600 hover:bg-dfp-green-50 transition-colors cursor-pointer disabled:opacity-50" title="Approve">
                            <i className="ri-check-line text-sm"></i>
                          </button>
                        )}
                        {doc.review_status !== 'rejected' && (
                          <button onClick={() => updateDocStatus(doc.id, 'rejected')} disabled={actionLoading} className="w-6 h-6 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Reject">
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        )}
                      </div>
                      {(doc.review_status === 'approved' || doc.review_status === 'rejected') && (
                        <p className="text-[10px] text-dfp-stone-400 mt-1.5 pl-10">
                          Reviewed by {doc.reviewer ? `${doc.reviewer.first_name} ${doc.reviewer.last_name}` : 'unknown'}
                          {doc.reviewed_at ? ` · ${new Date(doc.reviewed_at).toLocaleString()}` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-dfp-stone-400">No documents uploaded</p>}
            </div>

            {/* Meta */}
            <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5">
              <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3">Application Info</h3>
              <dl className="space-y-2 text-xs">
                <div><dt className="text-dfp-stone-400">Profile Completion</dt><dd className="text-dfp-stone-700 font-medium">{app.profile_completion || 0}%</dd></div>
                <div><dt className="text-dfp-stone-400">Submitted</dt><dd className="text-dfp-stone-700">{app.submitted_at ? new Date(app.submitted_at).toLocaleString() : '—'}</dd></div>
                <div><dt className="text-dfp-stone-400">Approved</dt><dd className="text-dfp-stone-700">{app.approved_at ? new Date(app.approved_at).toLocaleString() : '—'}</dd></div>
                <div><dt className="text-dfp-stone-400">Created</dt><dd className="text-dfp-stone-700">{new Date(app.created_at).toLocaleString()}</dd></div>
                {app.rejection_reason && <div><dt className="text-dfp-stone-400">Rejection Reason</dt><dd className="text-red-600">{app.rejection_reason}</dd></div>}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </PortalLayout>
  );
}