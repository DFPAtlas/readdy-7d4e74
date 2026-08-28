import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface Timesheet {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  hourly_rate: number;
  currency: string;
  total_amount: number;
  notes: string;
  submitted_at: string;
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string;
  assignment: { id: string; title: string; reference: string } | null;
}

interface TimeEntry {
  id: string;
  entry_date: string;
  hours: number;
  description: string;
  billable: boolean;
  task_reference: string;
}

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600', icon: 'ri-draft-line' },
  submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700', icon: 'ri-send-plane-line' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: 'ri-search-eye-line' },
  approved: { label: 'Approved', color: 'bg-dfp-green-100 text-dfp-green-700', icon: 'ri-check-double-line' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: 'ri-close-circle-line' },
  invoiced: { label: 'Invoiced', color: 'bg-dfp-green-100 text-dfp-green-700', icon: 'ri-bill-line' },
};

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<{ id: string; invoice_number: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [tsRes, entriesRes] = await Promise.all([
          supabase.from('timesheets').select('*, assignment:assignments(id, title, reference)').eq('id', id).maybeSingle(),
          supabase.from('time_entries').select('*').eq('timesheet_id', id).order('entry_date'),
        ]);

        if (cancelled) return;
        if (tsRes.error) throw tsRes.error;
        if (entriesRes.error) throw entriesRes.error;
        if (!tsRes.data) { setError('Timesheet not found'); return; }

        setTimesheet(tsRes.data);
        setEntries(entriesRes.data || []);

        // Fetch linked invoice if timesheet is invoiced
        if (tsRes.data.status === 'invoiced') {
          const { data: invItem } = await supabase
            .from('invoice_items')
            .select('invoice_id')
            .eq('timesheet_id', tsRes.data.id)
            .limit(1)
            .maybeSingle();
          if (invItem) {
            const { data: inv } = await supabase
              .from('invoices')
              .select('id, invoice_number')
              .eq('id', invItem.invoice_id)
              .maybeSingle();
            if (inv && !cancelled) setLinkedInvoice(inv);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async () => {
    if (!timesheet) return;
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('timesheets')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', timesheet.id);

      if (updateError) throw updateError;
      setTimesheet({ ...timesheet, status: 'submitted', submitted_at: new Date().toISOString() });
    } catch (err: any) {
      setError(err.message);
    } finally {
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

  if (error || !timesheet) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Timesheet not found'}</p>
          <Link to="/portal/timesheets" className="text-sm font-medium text-dfp-green-700">Back to timesheets</Link>
        </div>
      </PortalLayout>
    );
  }

  const s = statusMap[timesheet.status] || statusMap.draft;

  // Group entries by date
  const groupedEntries: Record<string, TimeEntry[]> = {};
  entries.forEach((e) => {
    if (!groupedEntries[e.entry_date]) groupedEntries[e.entry_date] = [];
    groupedEntries[e.entry_date].push(e);
  });
  const sortedDates = Object.keys(groupedEntries).sort();

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/portal/timesheets" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to timesheets
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-[10px] font-mono font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{timesheet.reference}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                {linkedInvoice && (
                  <Link to={`/portal/invoices/${linkedInvoice.id}`} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-dfp-green-100 text-dfp-green-700 hover:bg-dfp-green-200 transition-colors cursor-pointer">
                    Invoice {linkedInvoice.invoice_number} <i className="ri-arrow-right-line ml-0.5"></i>
                  </Link>
                )}
              </div>
              <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-1">
                {timesheet.assignment?.title || 'Timesheet'}
              </h1>
              <p className="text-sm text-dfp-stone-500">
                {timesheet.assignment?.reference} · {new Date(timesheet.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(timesheet.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {timesheet.status === 'draft' && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}
          </div>

          {/* Rate info */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Total Hours</p>
              <p className="text-sm font-bold text-dfp-stone-900">{Number(timesheet.total_hours || 0).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Billable</p>
              <p className="text-sm font-bold text-dfp-green-700">{Number(timesheet.billable_hours || 0).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Non-Billable</p>
              <p className="text-sm font-bold text-dfp-stone-500">{Number(timesheet.non_billable_hours || 0).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Hourly Rate</p>
              <p className="text-sm font-bold text-dfp-stone-900">{timesheet.currency} {Number(timesheet.hourly_rate || 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Total Amount</p>
              <p className="text-sm font-bold text-dfp-stone-900">{timesheet.currency} {Number(timesheet.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Review info if applicable */}
        {(timesheet.reviewed_at || timesheet.status === 'rejected') && (
          <div className={`rounded-xl border p-4 mb-6 ${timesheet.status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-dfp-blue-50 border-dfp-blue-100'}`}>
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${timesheet.status === 'rejected' ? 'bg-red-100' : 'bg-dfp-blue-100'}`}>
                <i className={`text-sm ${timesheet.status === 'rejected' ? 'ri-close-circle-line text-red-600' : 'ri-check-double-line text-dfp-blue-600'}`}></i>
              </div>
              <div>
                <p className={`text-sm font-medium ${timesheet.status === 'rejected' ? 'text-red-800' : 'text-dfp-blue-800'}`}>
                  {timesheet.status === 'rejected' ? 'Timesheet Rejected' : 'Timesheet Approved'}
                </p>
                {timesheet.review_notes && (
                  <p className="text-xs text-dfp-stone-600 mt-1">{timesheet.review_notes}</p>
                )}
                <p className="text-xs text-dfp-stone-400 mt-1">
                  Reviewed {timesheet.reviewed_at ? new Date(timesheet.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time entries grouped by date */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Time Entries</h2>
          {sortedDates.length === 0 ? (
            <p className="text-sm text-dfp-stone-400">No time entries recorded.</p>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-dfp-stone-500">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="h-px flex-1 bg-dfp-stone-100"></span>
                    <span className="text-xs font-medium text-dfp-stone-500">
                      {groupedEntries[date].reduce((s, e) => s + Number(e.hours || 0), 0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {groupedEntries[date].map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-dfp-stone-50">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${entry.billable ? 'bg-dfp-green-500' : 'bg-dfp-stone-400'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-dfp-stone-700">{entry.description}</p>
                          {entry.task_reference && (
                            <p className="text-xs text-dfp-stone-400 mt-0.5">Task: {entry.task_reference}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${entry.billable ? 'bg-dfp-green-100 text-dfp-green-700' : 'bg-dfp-stone-100 text-dfp-stone-500'}`}>
                            {entry.billable ? 'Billable' : 'Non-billable'}
                          </span>
                          <span className="text-sm font-semibold text-dfp-stone-900 w-10 text-right">{Number(entry.hours || 0).toFixed(1)}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {timesheet.notes && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-2">Notes</h2>
            <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{timesheet.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-dfp-stone-400 space-y-1">
          <p>Created {new Date(timesheet.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          {timesheet.submitted_at && <p>Submitted {new Date(timesheet.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
        </div>
      </div>
    </PortalLayout>
  );
}