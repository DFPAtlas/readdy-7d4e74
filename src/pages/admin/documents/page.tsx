import { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';
import DocumentViewerModal from '@/components/feature/DocumentViewerModal';

const adminSidebar = [
  { label: 'Overview', href: '/admin', icon: 'ri-dashboard-line' },
  { label: 'Applications', href: '/admin/applications', icon: 'ri-file-list-3-line' },
  { label: 'Freelancers', href: '/admin/freelancers', icon: 'ri-user-line', comingSoon: true },
  { label: 'Documents', href: '/admin/documents', icon: 'ri-folder-line' },
  { label: 'Compliance', href: '/admin/compliance', icon: 'ri-shield-check-line', comingSoon: true },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
];

const STATUSES = ['all', 'unreviewed', 'approved', 'rejected'];
const CATEGORIES = ['all', 'cv', 'identification', 'certificate', 'insurance', 'company_evidence', 'other'];

const CATEGORY_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  identification: 'Identification',
  certificate: 'Professional Certificate',
  insurance: 'Insurance Document',
  company_evidence: 'Company Evidence',
  other: 'Other Document',
};

const STATUS_BADGE: Record<string, string> = {
  unreviewed: 'bg-amber-100 text-amber-600',
  approved: 'bg-dfp-green-100 text-dfp-green-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function AdminDocumentsPage() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      let query = supabase.from('freelancer_documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('review_status', statusFilter);

      const { data, error: err } = await query;
      if (err) throw err;

      let docsData = data || [];

      if (docsData.length > 0) {
        const userIds = Array.from(new Set(docsData.map((d: any) => d.user_id)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { profileMap[p.id] = p; });

        const reviewerIds = Array.from(new Set(docsData.map((d: any) => d.reviewed_by).filter(Boolean)));
        const reviewerMap: Record<string, any> = {};
        if (reviewerIds.length > 0) {
          const { data: reviewersData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', reviewerIds);
          (reviewersData || []).forEach((p: any) => { reviewerMap[p.id] = p; });
        }

        docsData = docsData.map((d: any) => ({ ...d, owner: profileMap[d.user_id] || null, reviewer: reviewerMap[d.reviewed_by] || null }));
      }

      let filtered = docsData;
      if (categoryFilter !== 'all') filtered = filtered.filter((d: any) => d.category === categoryFilter);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((d: any) =>
          (d.file_name || '').toLowerCase().includes(q) ||
          `${d.owner?.first_name || ''} ${d.owner?.last_name || ''}`.toLowerCase().includes(q) ||
          (d.owner?.email || '').toLowerCase().includes(q)
        );
      }

      setDocs(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [statusFilter, categoryFilter, search]);

  const updateDocStatus = async (docId: string, status: string) => {
    if (!profile) return;
    setBusyId(docId);
    try {
      const { error: err } = await supabase.from('freelancer_documents').update({
        review_status: status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', docId);
      if (err) throw err;
      fetchDocs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return 'ri-file-pdf-line text-red-500';
    if (type?.includes('image')) return 'ri-image-line text-dfp-green-500';
    return 'ri-file-text-line text-dfp-stone-500';
  };

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">Document Review</h1>
            <p className="text-sm text-dfp-stone-500 mt-0.5">Review applicant CVs, certificates and supporting files.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-dfp-stone-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name or freelancer..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s === 'unreviewed' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : CATEGORY_LABELS[c] || c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDocs} className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer">Retry</button>
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
              <i className="ri-file-search-line text-xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No documents match your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-dfp-stone-50 border-b border-dfp-stone-200 text-[11px] font-semibold text-dfp-stone-500 uppercase tracking-wider">
              <div className="col-span-3">Document</div>
              <div className="col-span-2">Freelancer</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            {docs.map((doc: any) => (
              <div key={doc.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 border-b border-dfp-stone-50 hover:bg-dfp-stone-50/50 transition-colors items-center">
                <div className="md:col-span-3 flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
                    <i className={`${getFileIcon(doc.file_type)} text-sm`}></i>
                  </div>
                  <p className="text-sm font-medium text-dfp-stone-900 truncate">{doc.file_name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-dfp-stone-600">{doc.owner ? `${doc.owner.first_name} ${doc.owner.last_name}` : '—'}</p>
                  <p className="text-[10px] text-dfp-stone-400 truncate">{doc.owner?.email}</p>
                </div>
                <div className="md:col-span-2 text-xs text-dfp-stone-600">{CATEGORY_LABELS[doc.category] || doc.category}</div>
                <div className="md:col-span-1 text-xs text-dfp-stone-500">{doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}</div>
                <div className="md:col-span-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${STATUS_BADGE[doc.review_status] || STATUS_BADGE.unreviewed}`}>
                    {doc.review_status === 'unreviewed' || !doc.review_status ? 'Pending' : doc.review_status}
                  </span>
                  {(doc.review_status === 'approved' || doc.review_status === 'rejected') && (
                    <p className="text-[10px] text-dfp-stone-400 mt-1" title={doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleString() : ''}>
                      {doc.reviewer ? `${doc.reviewer.first_name} ${doc.reviewer.last_name}` : 'Unknown reviewer'}
                      {doc.reviewed_at ? ` · ${new Date(doc.reviewed_at).toLocaleString()}` : ''}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center gap-1">
                  <button onClick={() => setViewingDoc(doc)} className="w-8 h-8 rounded-lg flex items-center justify-center text-dfp-stone-500 hover:text-dfp-green-700 hover:bg-dfp-green-50 transition-colors cursor-pointer" title="View">
                    <i className="ri-eye-line"></i>
                  </button>
                  <button onClick={() => updateDocStatus(doc.id, 'approved')} disabled={busyId === doc.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-dfp-green-600 hover:bg-dfp-green-50 transition-colors cursor-pointer disabled:opacity-50" title="Approve">
                    <i className="ri-check-line"></i>
                  </button>
                  <button onClick={() => updateDocStatus(doc.id, 'rejected')} disabled={busyId === doc.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Reject">
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      </div>
    </PortalLayout>
  );
}