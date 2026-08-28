import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';

interface Milestone {
  id: string;
  assignment_id: string;
  title: string;
  description: string;
  due_date: string | null;
  amount: number;
  currency: string;
  status: string;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  invoice_eligible: boolean;
  sort_order: number;
}

interface MilestonesTabProps {
  assignmentId: string;
  isStaff: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-dfp-stone-100 text-dfp-stone-600',
  in_progress: 'bg-dfp-blue-100 text-dfp-blue-700',
  completed: 'bg-amber-100 text-amber-700',
  approved: 'bg-dfp-green-100 text-dfp-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MilestonesTab({ assignmentId, isStaff }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', amount: '' });

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error: fErr } = await supabase
        .from('assignment_milestones')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sort_order', { ascending: true })
        .order('due_date', { ascending: true });
      if (fErr) throw fErr;
      setMilestones(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [assignmentId]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const { error: insErr } = await supabase.from('assignment_milestones').insert({
        assignment_id: assignmentId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        amount: form.amount ? parseFloat(form.amount) : null,
        currency: 'GBP',
        status: 'pending',
      });
      if (insErr) throw insErr;
      setShowForm(false);
      setForm({ title: '', description: '', due_date: '', amount: '' });
      fetchMilestones();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
      if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
      const { error: updErr } = await supabase.from('assignment_milestones').update(updates).eq('id', id);
      if (updErr) throw updErr;
      fetchMilestones();
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

  const completedCount = milestones.filter(m => m.status === 'completed' || m.status === 'approved').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Milestones</h2>
          {milestones.length > 0 && (
            <p className="text-xs text-dfp-stone-400 mt-0.5">{completedCount} of {milestones.length} completed</p>
          )}
        </div>
        {isStaff && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className={`${showForm ? 'ri-close-line' : 'ri-add-line'} mr-1`}></i>
            {showForm ? 'Cancel' : 'Add Milestone'}
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>}

      {showForm && (
        <div className="bg-dfp-stone-50 rounded-xl border border-dfp-stone-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. Alpha prototype delivered" className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Amount (GBP)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="e.g. 2500.00" className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Brief milestone description..." className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400 resize-none" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving || !form.title.trim()} className="px-4 py-2 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap">
            {saving ? 'Creating...' : 'Create Milestone'}
          </button>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dfp-stone-200">
          <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
            <i className="ri-flag-line text-xl text-dfp-stone-300"></i>
          </div>
          <p className="text-sm text-dfp-stone-400 mb-1">No milestones yet</p>
          <p className="text-xs text-dfp-stone-300">{isStaff ? 'Click "Add Milestone" to create the first one.' : 'Milestones will be defined by the project manager.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={m.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.status === 'approved' ? 'bg-dfp-green-100 text-dfp-green-700' :
                    m.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                    m.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-dfp-stone-100 text-dfp-stone-500'
                  }`}>{i + 1}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-dfp-stone-800">{m.title}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[m.status] || ''}`}>{m.status.replace(/_/g, ' ')}</span>
                      {m.invoice_eligible && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700">Invoice Eligible</span>}
                    </div>
                    {m.description && <p className="text-xs text-dfp-stone-400 line-clamp-2">{m.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-dfp-stone-400">
                      {m.due_date && <span><i className="ri-calendar-line mr-1"></i>{new Date(m.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {m.amount && <span className="font-medium text-dfp-stone-600"><i className="ri-money-pound-circle-line mr-1"></i>{m.currency} {m.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                {isStaff && (
                  <select
                    value={m.status}
                    onChange={e => handleStatusChange(m.id, e.target.value)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-dfp-stone-200 bg-white text-dfp-stone-600 cursor-pointer flex-shrink-0"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="approved">Approved</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}