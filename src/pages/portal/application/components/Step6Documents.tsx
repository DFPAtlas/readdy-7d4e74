import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { ApplicationFormData } from '../page';

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
  file_size: number;
  review_status: string;
  created_at: string;
}

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step6Documents({ data, onChange }: Props) {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('cv');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      const { data: docsData, error } = await supabase.from('freelancer_documents').select('id,category,file_name,file_size,review_status,created_at').eq('user_id', profile.id).is('deleted_at', null).order('created_at', { ascending: false });
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

      // Refresh
      const { data: refreshed } = await supabase.from('freelancer_documents').select('id,category,file_name,file_size,review_status,created_at').eq('user_id', profile.id).is('deleted_at', null).order('created_at', { ascending: false });
      setDocs(refreshed || []);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
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

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Documents</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Upload your CV and supporting documents. File uploads are stored securely on our private storage.</p>

      {/* Existing docs */}
      {docs.length > 0 && (
        <div className="space-y-2 mb-6">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-dfp-stone-50 rounded-lg border border-dfp-stone-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-dfp-blue-50 flex items-center justify-center flex-shrink-0">
                  <i className="ri-file-text-line text-dfp-blue-600"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dfp-stone-900 truncate">{doc.file_name}</p>
                  <p className="text-[11px] text-dfp-stone-400">{getCategoryLabel(doc.category)} · {(doc.file_size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  className="w-7 h-7 rounded flex items-center justify-center text-dfp-stone-400 hover:text-dfp-green-600 hover:bg-dfp-green-50 transition-colors cursor-pointer disabled:opacity-50"
                  title="Download"
                >
                  {downloading === doc.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <i className="ri-download-line text-sm"></i>
                  )}
                </button>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                  doc.review_status === 'approved' ? 'bg-dfp-green-100 text-dfp-green-700' :
                  doc.review_status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {doc.review_status === 'unreviewed' ? 'Pending' : doc.review_status}
                </span>
                <button onClick={() => handleDelete(doc.id)} className="w-7 h-7 rounded flex items-center justify-center text-dfp-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="bg-white border-2 border-dashed border-dfp-stone-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
          <i className="ri-upload-cloud-2-line text-xl text-dfp-stone-400"></i>
        </div>
        <p className="text-sm text-dfp-stone-600 mb-1">Upload a document</p>
        <p className="text-xs text-dfp-stone-400 mb-4">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
        <div className="flex items-center justify-center gap-3">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label className={`px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap ${uploading ? 'opacity-60 pointer-events-none' : 'hover:bg-dfp-green-700'} transition-colors`}>
            {uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}