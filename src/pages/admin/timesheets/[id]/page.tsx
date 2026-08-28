import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  { label: 'Timesheets', href: '/admin/timesheets', icon: 'ri-time-line' },
  { label: 'Invoices', href: '/admin/invoices', icon: 'ri-bill-line' },
  { label: 'Payments', href: '/admin/payments', icon: 'ri-bank-line' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'ri-history-line', comingSoon: true },
  { label: 'Settings', href: '/admin/settings', icon: 'ri-settings-line', comingSoon: true },
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
  reviewed_at: string;
  review_notes: string;
  freelancer_id: string;
  assignment_id: string;
  freelancer: { id: string; first_name: string; last_name: string; email: string } | null;
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

function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${rand}`;
}

export default function AdminTimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tsRes, entriesRes] = await Promise.all([
          supabase.from('timesheets').select('*, freelancer:profiles!timesheets_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)').eq('id', id).maybeSingle(),
          supabase.from('time_entries').select('*').eq('timesheet_id', id).order('entry_date'),
        ]);
        if (cancelled) return;
        if (tsRes.error) throw tsRes.error;
        if (!tsRes.data) { setError('Timesheet not found'); return; }
        setTimesheet(tsRes.data);
        setEntries(entriesRes.data || []);
        if (tsRes.data.review_notes) setReviewNotes(tsRes.data.review_notes);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const handleAction = async (action: 'start_review' | 'approve' | 'reject') => {
    if (!timesheet || !profile) return;
    setActionLoading(true);
    setActionMsg(null);
    setError(null);
    setInvoiceId(null);
    setInvoiceNumber(null);

    try {
      const newStatus = action === 'start_review' ? 'under_review' : action === 'approve' ? 'approved' : 'rejected';
      const { error: updateError } = await supabase
        .from('timesheets')
        .update({
          status: newStatus,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', timesheet.id);

      if (updateError) throw updateError;

      setTimesheet({ ...timesheet, status: newStatus, reviewed_by: profile.id, reviewed_at: new Date().toISOString(), review_notes: reviewNotes });

      // Auto-create invoice when approving
      if (action === 'approve') {
        const billableAmount = Number(timesheet.billable_hours || 0) * Number(timesheet.hourly_rate || 0);

        if (billableAmount <= 0) {
          setActionMsg('Timesheet approved. No billable hours to invoice.');
          return;
        }

        try {
          // Check for an existing open invoice for this freelancer + assignment
          const { data: existing } = await supabase
            .from('invoices')
            .select('id, status, subtotal, vat_amount, total_amount, paid_amount, balance_due, invoice_number')
            .eq('freelancer_id', timesheet.freelancer_id)
            .eq('assignment_id', timesheet.assignment_id)
            .in('status', ['draft', 'issued', 'part_paid'])
            .order('created_at', { ascending: false })
            .limit(1);

          let targetInvoiceId: string;

          if (existing && existing.length > 0) {
            // Add to existing invoice
            targetInvoiceId = existing[0].id;
            const inv = existing[0];
            const newSubtotal = Number(inv.subtotal || 0) + billableAmount;
            const vatRate = 20;
            const newVat = Number((newSubtotal * vatRate / 100).toFixed(2));
            const newTotal = Number((newSubtotal + newVat).toFixed(2));
            const newBalance = Number((newTotal - Number(inv.paid_amount || 0)).toFixed(2));

            // Get max sort_order
            const { data: maxSort } = await supabase
              .from('invoice_items')
              .select('sort_order')
              .eq('invoice_id', targetInvoiceId)
              .order('sort_order', { ascending: false })
              .limit(1);
            const nextSort = (maxSort && maxSort.length > 0 ? Number(maxSort[0].sort_order) : 0) + 1;

            // Create line item
            const periodLabel = `${new Date(timesheet.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(timesheet.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            const { error: itemError } = await supabase.from('invoice_items').insert({
              invoice_id: targetInvoiceId,
              item_type: 'timesheet',
              description: `Timesheet ${timesheet.reference}: ${periodLabel}`,
              quantity: Number(timesheet.billable_hours),
              unit_price: Number(timesheet.hourly_rate),
              amount: billableAmount,
              timesheet_id: timesheet.id,
              sort_order: nextSort,
            });
            if (itemError) throw itemError;

            // Update invoice totals
            const { error: invUpdateError } = await supabase
              .from('invoices')
              .update({
                subtotal: newSubtotal,
                vat_rate: vatRate,
                vat_amount: newVat,
                total_amount: newTotal,
                balance_due: newBalance,
              })
              .eq('id', targetInvoiceId);
            if (invUpdateError) throw invUpdateError;

            setInvoiceId(targetInvoiceId);
            setInvoiceNumber(inv.invoice_number);
          } else {
            // Create new invoice
            const invNumber = generateInvoiceNumber();
            const vatRate = 20;
            const vatAmount = Number((billableAmount * vatRate / 100).toFixed(2));
            const totalAmount = Number((billableAmount + vatAmount).toFixed(2));
            const issueDate = new Date().toISOString().split('T')[0];
            const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { data: newInv, error: invCreateError } = await supabase
              .from('invoices')
              .insert({
                freelancer_id: timesheet.freelancer_id,
                assignment_id: timesheet.assignment_id,
                invoice_number: invNumber,
                reference: timesheet.assignment?.reference || null,
                issue_date: issueDate,
                due_date: dueDate,
                status: 'issued',
                currency: timesheet.currency || 'GBP',
                subtotal: billableAmount,
                vat_rate: vatRate,
                vat_amount: vatAmount,
                total_amount: totalAmount,
                paid_amount: 0,
                balance_due: totalAmount,
                payment_terms: 'Net 30',
                issued_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (invCreateError) throw invCreateError;
            targetInvoiceId = newInv.id;

            // Create line item
            const periodLabel = `${new Date(timesheet.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(timesheet.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            const { error: itemError } = await supabase.from('invoice_items').insert({
              invoice_id: targetInvoiceId,
              item_type: 'timesheet',
              description: `Timesheet ${timesheet.reference}: ${periodLabel}`,
              quantity: Number(timesheet.billable_hours),
              unit_price: Number(timesheet.hourly_rate),
              amount: billableAmount,
              timesheet_id: timesheet.id,
              sort_order: 1,
            });
            if (itemError) throw itemError;

            setInvoiceId(targetInvoiceId);
            setInvoiceNumber(invNumber);
          }

          // Update timesheet to invoiced
          const { error: invoicedError } = await supabase
            .from('timesheets')
            .update({ status: 'invoiced' })
            .eq('id', timesheet.id);

          if (invoicedError) {
            // Invoice created but timesheet status update failed — still show success
            setActionMsg(`Invoice ${invoiceNumber || 'created'} but timesheet status sync failed.`);
          } else {
            setTimesheet((prev) => prev ? { ...prev, status: 'invoiced' } : prev);
            setActionMsg(`Timesheet approved and invoice ${invoiceNumber || 'created'} automatically.`);
          }
        } catch (invoiceErr: any) {
          // Timesheet was approved but invoice creation failed
          setActionMsg(`Timesheet approved, but invoice creation failed: ${invoiceErr.message}. Please create the invoice manually.`);
        }
      } else {
        setActionMsg(action === 'reject' ? 'Timesheet rejected.' : 'Review started.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !timesheet) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Not found'}</p>
          <Link to="/admin/timesheets" className="text-sm font-medium text-dfp-green-700">Back to timesheets</Link>
        </div>
      </PortalLayout>
    );
  }

  const s = statusMap[timesheet.status] || statusMap.draft;
  const groupedEntries: Record<string, TimeEntry[]> = {};
  entries.forEach((e) => { if (!groupedEntries[e.entry_date]) groupedEntries[e.entry_date] = []; groupedEntries[e.entry_date].push(e); });
  const sortedDates = Object.keys(groupedEntries).sort();

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/timesheets" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to timesheets
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-[10px] font-mono font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{timesheet.reference}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </div>
              <h1 className="font-display text-xl font-bold text-dfp-stone-900 mb-1">{timesheet.assignment?.title || 'Timesheet'}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-dfp-stone-500">
                <span>{timesheet.freelancer?.first_name} {timesheet.freelancer?.last_name}</span>
                <span>·</span>
                <span className="text-xs">{timesheet.freelancer?.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Period</p>
              <p className="text-sm font-medium text-dfp-stone-700">{new Date(timesheet.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(timesheet.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Total Hours</p>
              <p className="text-sm font-bold text-dfp-stone-900">{Number(timesheet.total_hours).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Billable Hours</p>
              <p className="text-sm font-bold text-dfp-green-700">{Number(timesheet.billable_hours).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Rate</p>
              <p className="text-sm font-bold text-dfp-stone-900">{timesheet.currency} {Number(timesheet.hourly_rate).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Amount</p>
              <p className="text-sm font-bold text-dfp-stone-900">{timesheet.currency} {Number(timesheet.total_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Success message */}
        {actionMsg && (
          <div className="p-4 bg-dfp-green-50 border border-dfp-green-100 rounded-xl text-sm text-dfp-green-700 mb-6">
            {actionMsg}
            {invoiceId && (
              <Link to={`/admin/invoices/${invoiceId}`} className="inline-flex items-center gap-1 ml-2 font-semibold underline hover:text-dfp-green-800 cursor-pointer">
                View Invoice {invoiceNumber} <i className="ri-arrow-right-line text-xs"></i>
              </Link>
            )}
          </div>
        )}

        {/* Review action bar */}
        {(timesheet.status === 'submitted' || timesheet.status === 'under_review') && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Review Action</h2>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              placeholder="Review notes (optional)..."
              className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 resize-none mb-4 placeholder:text-dfp-stone-300"
            />
            <div className="flex items-center gap-3">
              {timesheet.status === 'submitted' && (
                <button
                  onClick={() => handleAction('start_review')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-dfp-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  Start Review
                </button>
              )}
              <button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {actionLoading ? 'Processing...' : 'Approve & Generate Invoice'}
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Time entries */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Time Entries</h2>
          {sortedDates.length === 0 ? (
            <p className="text-sm text-dfp-stone-400">No time entries.</p>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-dfp-stone-500">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="h-px flex-1 bg-dfp-stone-100"></span>
                    <span className="text-xs font-medium text-dfp-stone-500">{groupedEntries[date].reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h</span>
                  </div>
                  {groupedEntries[date].map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-dfp-stone-50 mb-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${entry.billable ? 'bg-dfp-green-500' : 'bg-dfp-stone-400'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dfp-stone-700">{entry.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${entry.billable ? 'bg-dfp-green-100 text-dfp-green-700' : 'bg-dfp-stone-100 text-dfp-stone-500'}`}>
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </span>
                        <span className="text-sm font-semibold text-dfp-stone-900 w-10 text-right">{Number(entry.hours).toFixed(1)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {timesheet.notes && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-2">Freelancer Notes</h2>
            <p className="text-sm text-dfp-stone-600 whitespace-pre-line">{timesheet.notes}</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}