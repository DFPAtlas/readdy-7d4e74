import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';

interface Submission {
  id: string;
  assignment_id: string;
  task_id: string | null;
  milestone_id: string | null;
  submitted_by: string;
  title: string;
  description: string;
  submission_type: string;
  files: any[];
  status: string;
  version: number;
  reviewer_notes: string | null;
  changes_requested_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  decision: string;
  notes: string;
  rating: number | null;
  created_at: string;
}

interface SubmissionsTabProps {
  assignmentId: string;
  currentUserId: string;
  isStaff: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-dfp-stone-100 text-dfp-stone-600',
  submitted: 'bg-dfp-blue-100 text-dfp-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  changes_requested: 'bg-red-100 text-red-700',
  approved: 'bg-dfp-green-100 text-dfp-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const typeLabels: Record<string, string> = {
  deliverable: 'Deliverable',
  task_output: 'Task Output',
  milestone: 'Milestone',
  draft: 'Draft',
  final: 'Final',
};

export default function SubmissionsTab({ assignmentId, currentUserId, isStaff }: SubmissionsTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', submission_type: 'deliverable' });
  const [reviewForm, setReviewForm] = useState<{ submissionId: string | null; decision: string; notes: string; rating: number }>({ submissionId: null, decision: 'approved', notes: '', rating: 0 });

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error: fErr } = await supabase
        .from('work_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });
      if (fErr) throw fErr;
      setSubmissions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const { error: insErr } = await supabase.from('work_submissions').insert({
        assignment_id: assignmentId,
        submitted_by: currentUserId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        submission_type: form.submission_type,
        status: 'submitted',
        version: 1,
      });
      if (insErr) throw insErr;
      setShowForm(false);
      setForm({ title: '', description: '', submission_type: 'deliverable' });
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (submissionId: string, decision: string) => {
    try {
      const updates: any = {
        status: decision === 'approved' ? 'approved' : decision === 'changes_requested' ? 'changes_requested' : 'rejected',
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: reviewForm.notes || null,
        updated_at: new Date().toISOString(),
      };
      if (decision === 'changes_requested') {
        updates.changes_requested_notes = reviewForm.notes || null;
      }
      const { error: updErr } = await supabase.from('work_submissions').update(updates).eq('id', submissionId);
      if (updErr) throw updErr;

      if (reviewForm.notes) {
        await supabase.from('submission_reviews').insert({
          submission_id: submissionId,
          reviewer_id: currentUserId,
          decision: decision,
          notes: reviewForm.notes,
          rating: reviewForm.rating || null,
        });
      }

      setReviewForm({ submissionId: null, decision: 'approved', notes: '', rating: 0 });
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const { error: updErr } = await supabase.from('work_submissions').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', submissionId);
      if (updErr) throw updErr;
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Submissions</h2>
          {submissions.length > 0 && (
            <p className="text-xs text-dfp-stone-400 mt-0.5">{submissions.filter(s => s.status === 'approved').length} approved, {submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length} pending</p>
          )}
        </div>
        {!isStaff && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className={`${showForm ? 'ri-close-line' : 'ri-add-line'} mr-1`}></i>
            {showForm ? 'Cancel' : 'Submit Work'}
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>}

      {showForm && (
        <div className="bg-dfp-stone-50 rounded-xl border border-dfp-stone-200 p-4">
          <div className="space-y-3 mb-3">
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Homepage wireframes v1" className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Type</label>
              <select value={form.submission_type} onChange={e => setForm(prev => ({ ...prev, submission_type: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400">
                <option value="deliverable">Deliverable</option>
                <option value="task_output">Task Output</option>
                <option value="milestone">Milestone</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Describe what you're submitting..." className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400 resize-none" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="px-4 py-2 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap">
            {saving ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dfp-stone-200">
          <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
            <i className="ri-upload-cloud-2-line text-xl text-dfp-stone-300"></i>
          </div>
          <p className="text-sm text-dfp-stone-400 mb-1">No submissions yet</p>
          <p className="text-xs text-dfp-stone-300">{isStaff ? 'Submissions will appear here once the freelancer submits work.' : 'Submit your first piece of work for review.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-dfp-stone-800">{sub.title}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dfp-stone-100 text-dfp-stone-500">{typeLabels[sub.submission_type] || sub.submission_type}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[sub.status] || ''}`}>{sub.status.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-dfp-stone-400">v{sub.version}</span>
                  </div>
                  {sub.description && <p className="text-xs text-dfp-stone-500 line-clamp-2 mb-2">{sub.description}</p>}
                  <p className="text-[11px] text-dfp-stone-400">
                    Submitted {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {sub.reviewer_notes && (
                    <div className="mt-2 p-2.5 bg-dfp-stone-50 rounded-lg">
                      <p className="text-[11px] font-medium text-dfp-stone-600 mb-0.5">Reviewer Notes</p>
                      <p className="text-xs text-dfp-stone-500">{sub.reviewer_notes}</p>
                    </div>
                  )}
                  {sub.changes_requested_notes && (
                    <div className="mt-2 p-2.5 bg-red-50 rounded-lg">
                      <p className="text-[11px] font-medium text-red-600 mb-0.5">Changes Requested</p>
                      <p className="text-xs text-red-500">{sub.changes_requested_notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isStaff && (sub.status === 'submitted' || sub.status === 'under_review') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReview(sub.id, 'approved')}
                        className="px-2.5 py-1 bg-dfp-green-600 text-white text-[11px] font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setReviewForm({ submissionId: sub.id, decision: 'changes_requested', notes: '', rating: 0 })}
                        className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[11px] font-medium rounded-lg hover:bg-amber-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Changes
                      </button>
                      <button
                        onClick={() => handleReview(sub.id, 'rejected')}
                        className="px-2.5 py-1 bg-red-100 text-red-700 text-[11px] font-medium rounded-lg hover:bg-red-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {!isStaff && sub.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(sub.id, 'submitted')}
                      className="px-2.5 py-1 bg-dfp-blue-600 text-white text-[11px] font-medium rounded-lg hover:bg-dfp-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review form modal */}
      {reviewForm.submissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setReviewForm(prev => ({ ...prev, submissionId: null }))}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Request Changes</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Notes *</label>
                <textarea value={reviewForm.notes} onChange={e => setReviewForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Describe what needs to change..." className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 focus:outline-none focus:border-dfp-green-400 resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Rating (1-5)</label>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setReviewForm(prev => ({ ...prev, rating: n }))} className={`w-8 h-8 rounded-lg text-sm cursor-pointer transition-colors ${reviewForm.rating >= n ? 'bg-amber-100 text-amber-600' : 'bg-dfp-stone-100 text-dfp-stone-400'}`}>
                      <i className="ri-star-fill"></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleReview(reviewForm.submissionId!, 'changes_requested')} disabled={!reviewForm.notes.trim()} className="flex-1 px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap">Request Changes</button>
              <button onClick={() => setReviewForm(prev => ({ ...prev, submissionId: null }))} className="px-4 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-xs font-medium rounded-lg hover:bg-dfp-stone-200 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}