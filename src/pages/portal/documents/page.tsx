import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

const sidebarItems = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Application', href: '/portal/application', icon: 'ri-file-list-3-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Skills', href: '/portal/skills', icon: 'ri-award-line' },
  { label: 'Portfolio', href: '/portal/portfolio', icon: 'ri-briefcase-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Agreements', href: '/portal/agreements', icon: 'ri-file-text-line' },
  { label: 'Security', href: '/portal/security', icon: 'ri-shield-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

const DOC_CATEGORIES = [
  { value: 'cv', label: 'CV / Resume' },
  { value: 'identification', label: 'Identification' },
  { value: 'certificate', label: 'Professional Certificate' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'company_evidence', label: 'Company Evidence' },
  { value: 'other', label: 'Other Document' },
];

interface DocItem {
  id: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  review_status: string;
  created_at: string;
}

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('cv');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      const { data: docsData, error } = await supabase
        .from('freelancer_documents')
        .select('id,category,file_name,file_path,file_size,file_type,review_status,created_at')
        .eq('user_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (!cancelled && !error) setDocs(docsData || []);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const filePath = `${profile.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('freelancer-documents').upload(filePath, file);
      if (uploadErr) throw uploadErr;

      await supabase.from('freelancer_documents').insert({
        user_id: profile.id,
        category: selectedCategory,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        review_status: 'unreviewed',
      });

      const { data: refreshed } = await supabase
        .from('freelancer_documents')
        .select('id,category,file_name,file_path,file_size,file_type,review_status,created_at')
        .eq('user_id', profile.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      setDocs(refreshed || []);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      const input = document.getElementById('doc-upload-input') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    await supabase.from('freelancer_documents').update({ deleted_at: new Date().toISOString() }).eq('id', docId);
    setDocs(docs.filter((d) => d.id !== docId));
  };

  const handleDownload = async (doc: DocItem) => {
    setDownloading(doc.id);
    try {
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('freelancer-documents')
        .createSignedUrl(doc.file_path, 120);
      if (signedErr) throw signedErr;
      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const getCategoryLabel = (cat: string) => DOC_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'ri-file-pdf-line text-red-500';
    if (type.includes('word') || type.includes('document')) return 'ri-file-word-line text-dfp-blue-500';
    if (type.includes('image')) return 'ri-image-line text-dfp-green-500';
    return 'ri-file-text-line text-dfp-stone-500';
  };

  const filteredDocs = filterCategory === 'all' ? docs : docs.filter((d) => d.category === filterCategory);

  if (loading) {
    return (
      <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">Documents</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">
              {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded · Upload and manage your supporting files.
            </p>
          </div>
          <Link
            to="/portal/application?step=6"
            className="inline-flex items-center gap-1.5 text-sm text-dfp-green-700 hover:text-dfp-green-800 font-medium cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-list-3-line"></i> Application Wizard
          </Link>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-4 md:p-5 mb-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="w-11 h-11 rounded-xl bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
                <i className="ri-upload-cloud-2-line text-lg text-dfp-stone-400"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dfp-stone-800">Upload a Document</p>
                <p className="text-xs text-dfp-stone-400">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <label className={`px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap ${uploading ? 'opacity-60 pointer-events-none' : 'hover:bg-dfp-green-700'} transition-colors`}>
                {uploading ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : (
                  'Choose File'
                )}
                <input
                  id="doc-upload-input"
                  type="file"
                  onChange={handleUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        {docs.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 flex-nowrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-dfp-stone-800 text-white'
                  : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'
              }`}
            >
              All ({docs.length})
            </button>
            {DOC_CATEGORIES.map((cat) => {
              const count = docs.filter((d) => d.category === cat.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === cat.value
                      ? 'bg-dfp-stone-800 text-white'
                      : 'bg-dfp-stone-100 text-dfp-stone-600 hover:bg-dfp-stone-200'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Document list */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dfp-stone-200">
            <div className="w-16 h-16 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-folder-open-line text-2xl text-dfp-stone-300"></i>
            </div>
            <h2 className="text-base font-semibold text-dfp-stone-700 mb-1">
              {docs.length === 0 ? 'No documents yet' : 'No documents in this category'}
            </h2>
            <p className="text-sm text-dfp-stone-400 mb-5">
              {docs.length === 0 ? 'Upload your CV, certificates, and other supporting documents.' : 'Try a different category filter or upload a new document.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-dfp-stone-200 hover:border-dfp-stone-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
                    <i className={`${getFileIcon(doc.file_type)} text-lg`}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dfp-stone-900 truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-dfp-stone-400">{getCategoryLabel(doc.category)}</span>
                      <span className="text-[11px] text-dfp-stone-300">·</span>
                      <span className="text-[11px] text-dfp-stone-400">{(doc.file_size / 1024).toFixed(0)} KB</span>
                      <span className="text-[11px] text-dfp-stone-300">·</span>
                      <span className="text-[11px] text-dfp-stone-400">
                        {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      doc.review_status === 'approved'
                        ? 'bg-dfp-green-100 text-dfp-green-700'
                        : doc.review_status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {doc.review_status === 'unreviewed' ? 'Pending' : doc.review_status.charAt(0).toUpperCase() + doc.review_status.slice(1)}
                  </span>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-dfp-stone-400 hover:text-dfp-green-600 hover:bg-dfp-green-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Download"
                  >
                    {downloading === doc.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className="ri-download-line"></i>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-dfp-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}