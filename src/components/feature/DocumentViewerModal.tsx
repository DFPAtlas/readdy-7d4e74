import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';

interface DocFile {
  id: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  review_status: string;
  created_at?: string;
}

interface DocumentViewerModalProps {
  doc: DocFile | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  identification: 'Identification',
  certificate: 'Professional Certificate',
  insurance: 'Insurance Document',
  company_evidence: 'Company Evidence',
  other: 'Other Document',
};

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewerModal({ doc, onClose }: DocumentViewerModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) {
      setSignedUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSignedUrl(null);

    (async () => {
      const { data, error: err } = await supabase.storage
        .from('freelancer-documents')
        .createSignedUrl(doc.file_path, 600);
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [doc]);

  if (!doc) return null;

  const isPdf = doc.file_type?.toLowerCase().includes('pdf');
  const isImage = doc.file_type?.toLowerCase().includes('image');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-xl border border-dfp-stone-200 shadow-lg w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-dfp-stone-100 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
            <i className={`${isPdf ? 'ri-file-pdf-line text-red-500' : isImage ? 'ri-image-line text-dfp-green-500' : 'ri-file-text-line text-dfp-stone-500'} text-lg`}></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-dfp-stone-900 truncate">{doc.file_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-dfp-stone-400">{CATEGORY_LABELS[doc.category] || doc.category}</span>
              <span className="text-[11px] text-dfp-stone-300">·</span>
              <span className="text-[11px] text-dfp-stone-400">{formatBytes(doc.file_size)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-dfp-stone-500 hover:bg-dfp-stone-100 transition-colors cursor-pointer" aria-label="Close">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-dfp-stone-50 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
              </div>
              <p className="text-sm text-dfp-stone-600 mb-1">Could not load this document</p>
              <p className="text-xs text-dfp-stone-400">{error}</p>
            </div>
          ) : signedUrl && isPdf ? (
            <iframe src={signedUrl} title={doc.file_name} className="w-full h-[70vh] border-0" />
          ) : signedUrl && isImage ? (
            <div className="flex items-center justify-center p-6">
              <img src={signedUrl} alt={doc.file_name} className="max-w-full max-h-[70vh] object-contain" />
            </div>
          ) : signedUrl ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-dfp-stone-100 flex items-center justify-center mb-3">
                <i className="ri-file-download-line text-xl text-dfp-stone-500"></i>
              </div>
              <p className="text-sm text-dfp-stone-600 mb-4">This file type can't be previewed in the browser.</p>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-download-line mr-1"></i> Download
              </a>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-dfp-stone-100 flex-shrink-0">
          <span className="text-xs text-dfp-stone-400">Signed link expires in 10 minutes</span>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm text-dfp-stone-600 hover:text-dfp-stone-800 font-medium cursor-pointer whitespace-nowrap">
                <i className="ri-external-link-line mr-1"></i> Open in new tab
              </a>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-dfp-stone-800 text-white text-sm font-medium rounded-lg hover:bg-dfp-stone-900 transition-colors cursor-pointer whitespace-nowrap">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}