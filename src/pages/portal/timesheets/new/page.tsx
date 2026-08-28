import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

const approvedSidebar = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Available Work', href: '/portal/opportunities', icon: 'ri-briefcase-line' },
  { label: 'My Applications', href: '/portal/applications', icon: 'ri-file-list-3-line' },
  { label: 'Active Assignments', href: '/portal/assignments', icon: 'ri-list-check-3' },
  { label: 'Timesheets', href: '/portal/timesheets', icon: 'ri-time-line' },
  { label: 'Invoices', href: '/portal/invoices', icon: 'ri-bill-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

interface Assignment {
  id: string;
  title: string;
  reference: string;
  engagement_type: string;
  agreed_rate: number;
  currency: string;
}

interface TimeEntry {
  id?: string;
  entry_date: string;
  hours: number;
  description: string;
  billable: boolean;
  task_reference: string;
}

const emptyEntry = (): TimeEntry => ({
  entry_date: new Date().toISOString().split('T')[0],
  hours: 0,
  description: '',
  billable: true,
  task_reference: '',
});

export default function NewTimesheetPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7 || 7) + 1);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7 || 7) + 5);
    return d.toISOString().split('T')[0];
  });
  const [entries, setEntries] = useState<TimeEntry[]>([
    emptyEntry(), emptyEntry(), emptyEntry(), emptyEntry(), emptyEntry(),
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const fetchAssignments = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('assignments')
          .select('id, title, reference, engagement_type, agreed_rate, currency')
          .eq('freelancer_id', profile.id)
          .not('status', 'in', '("completed","cancelled","archived")')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setAssignments(data || []);
        if (data && data.length > 0) setSelectedAssignment(data[0].id);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAssignments();
    return () => { cancelled = true; };
  }, [profile]);

  const updateEntry = (index: number, field: keyof TimeEntry, value: string | number | boolean) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);

  const removeEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const valid = entries.filter((e) => e.hours > 0);
    const total = valid.reduce((s, e) => s + e.hours, 0);
    const billable = valid.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
    const nonBillable = valid.filter((e) => !e.billable).reduce((s, e) => s + e.hours, 0);
    return { total, billable, nonBillable };
  };

  const totals = calculateTotals();
  const selectedAssign = assignments.find((a) => a.id === selectedAssignment);

  const handleSave = async (submit = false) => {
    if (!profile || !selectedAssignment) return;
    const validEntries = entries.filter((e) => e.hours > 0 && e.description.trim());
    if (validEntries.length === 0) {
      setError('Add at least one time entry with hours and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const assign = assignments.find((a) => a.id === selectedAssignment);
      const rate = assign?.agreed_rate || 0;
      const reference = `TS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const { data: timesheet, error: tsError } = await supabase
        .from('timesheets')
        .insert({
          freelancer_id: profile.id,
          assignment_id: selectedAssignment,
          reference,
          period_start: periodStart,
          period_end: periodEnd,
          status: submit ? 'submitted' : 'draft',
          total_hours: totals.total,
          billable_hours: totals.billable,
          non_billable_hours: totals.nonBillable,
          hourly_rate: rate,
          currency: assign?.currency || 'GBP',
          total_amount: totals.billable * rate,
          notes: notes || null,
          submitted_at: submit ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (tsError) throw tsError;
      if (!timesheet) throw new Error('Failed to create timesheet');

      const { error: entriesError } = await supabase
        .from('time_entries')
        .insert(
          validEntries.map((e) => ({
            timesheet_id: timesheet.id,
            entry_date: e.entry_date,
            hours: e.hours,
            description: e.description,
            billable: e.billable,
            task_reference: e.task_reference || null,
          }))
        );

      if (entriesError) throw entriesError;

      navigate(`/portal/timesheets/${timesheet.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (assignments.length === 0) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-briefcase-line text-2xl text-amber-500"></i>
          </div>
          <p className="text-sm text-dfp-stone-600 mb-1">No active assignments found</p>
          <p className="text-xs text-dfp-stone-400 mb-4">You need an active assignment to create a timesheet.</p>
          <Link to="/portal/assignments" className="text-sm font-medium text-dfp-green-700">View assignments</Link>
        </div>
      </PortalLayout>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const getDayDate = (dayOffset: number) => {
    const start = new Date(periodStart);
    start.setDate(start.getDate() + dayOffset);
    return start.toISOString().split('T')[0];
  };

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/portal/timesheets" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to timesheets
        </Link>

        <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-6">New Timesheet</h1>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>
        )}

        {/* Assignment + Period */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Assignment</label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 cursor-pointer"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.reference}) — {a.currency} {a.agreed_rate}/{a.engagement_type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Rate</label>
              <div className="px-3 py-2.5 rounded-lg bg-dfp-stone-50 border border-dfp-stone-100 text-sm text-dfp-stone-900">
                {selectedAssign?.currency} {selectedAssign?.agreed_rate || '—'} / {selectedAssign?.engagement_type || '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Period Start (Mon)</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Period End (Fri)</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500"
              />
            </div>
          </div>
        </div>

        {/* Time entries */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Time Entries</h2>
            <button
              onClick={addEntry}
              className="inline-flex items-center gap-1 text-xs font-medium text-dfp-green-700 hover:text-dfp-green-800 cursor-pointer"
            >
              <i className="ri-add-line"></i> Add Row
            </button>
          </div>

          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-2 mb-2">
            <div className="col-span-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Day</div>
            <div className="col-span-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Date</div>
            <div className="col-span-5 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Description</div>
            <div className="col-span-1 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider text-right">Hours</div>
            <div className="col-span-1 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider text-center">Billable</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="sm:grid grid-cols-12 gap-3 items-center px-2 py-2 rounded-lg hover:bg-dfp-stone-50">
                <div className="col-span-2">
                  <span className="sm:hidden text-[10px] text-dfp-stone-400 mb-0.5 block">Day</span>
                  <select
                    value={entry.entry_date}
                    onChange={(e) => updateEntry(i, 'entry_date', e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-dfp-stone-200 text-xs text-dfp-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-dfp-green-500/20 cursor-pointer"
                  >
                    {days.map((day, di) => (
                      <option key={day} value={getDayDate(di)}>{day} — {new Date(getDayDate(di)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <span className="sm:hidden text-[10px] text-dfp-stone-400 mb-0.5 block">Date</span>
                  <input
                    type="date"
                    value={entry.entry_date}
                    onChange={(e) => updateEntry(i, 'entry_date', e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-dfp-stone-200 text-xs text-dfp-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-dfp-green-500/20"
                  />
                </div>
                <div className="col-span-5">
                  <span className="sm:hidden text-[10px] text-dfp-stone-400 mb-0.5 block">Description</span>
                  <input
                    type="text"
                    value={entry.description}
                    onChange={(e) => updateEntry(i, 'description', e.target.value)}
                    placeholder="What did you work on?"
                    className="w-full px-2 py-1.5 rounded border border-dfp-stone-200 text-xs text-dfp-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-dfp-green-500/20 placeholder:text-dfp-stone-300"
                  />
                </div>
                <div className="col-span-1">
                  <span className="sm:hidden text-[10px] text-dfp-stone-400 mb-0.5 block">Hours</span>
                  <input
                    type="number"
                    value={entry.hours || ''}
                    onChange={(e) => updateEntry(i, 'hours', parseFloat(e.target.value) || 0)}
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="0"
                    className="w-full px-2 py-1.5 rounded border border-dfp-stone-200 text-xs text-dfp-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-dfp-green-500/20 text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => updateEntry(i, 'billable', !entry.billable)}
                    className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                      entry.billable ? 'bg-dfp-green-100 text-dfp-green-600' : 'bg-dfp-stone-100 text-dfp-stone-400'
                    }`}
                    title={entry.billable ? 'Billable' : 'Non-billable'}
                  >
                    <i className={`text-xs ${entry.billable ? 'ri-check-line' : 'ri-close-line'}`}></i>
                  </button>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeEntry(i)}
                    className="w-7 h-7 rounded flex items-center justify-center text-dfp-stone-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex items-center justify-end gap-6 mt-4 pt-4 border-t border-dfp-stone-100">
            <div className="text-right">
              <p className="text-[10px] text-dfp-stone-400 uppercase tracking-wider">Total Hours</p>
              <p className="text-sm font-bold text-dfp-stone-900">{totals.total.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-dfp-stone-400 uppercase tracking-wider">Billable</p>
              <p className="text-sm font-bold text-dfp-green-700">{totals.billable.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-dfp-stone-400 uppercase tracking-wider">Amount</p>
              <p className="text-sm font-bold text-dfp-stone-900">
                {selectedAssign?.currency || 'GBP'} {(totals.billable * (selectedAssign?.agreed_rate || 0)).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes for this timesheet..."
            className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 resize-none placeholder:text-dfp-stone-300"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/portal/timesheets"
            className="px-4 py-2.5 text-sm font-medium text-dfp-stone-600 hover:text-dfp-stone-900 rounded-lg hover:bg-dfp-stone-100 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="px-5 py-2.5 bg-dfp-stone-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-stone-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}