import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

interface TimesheetData {
  id: string;
  reference: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  billable_hours: number;
  hourly_rate: number;
  currency: string;
  total_amount: number;
  submitted_at: string;
  reviewed_at: string;
  freelancer_id: string;
  assignment_id: string;
  freelancer: { id: string; first_name: string; last_name: string; email: string } | null;
  assignment: { id: string; title: string; reference: string } | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600' },
  submitted: { label: 'Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-dfp-green-100 text-dfp-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  invoiced: { label: 'Invoiced', color: 'bg-dfp-green-100 text-dfp-green-700' },
};

function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${rand}`;
}

export default function AdminTimesheetsPage() {
  const { profile } = useAuth();
  const [timesheets, setTimesheets] = useState<TimesheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Bulk selection + generation
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ invoices: { id: string; number: string }[]; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('timesheets')
          .select('*, freelancer:profiles!timesheets_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setTimesheets(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredTimesheets = filter === 'all'
    ? timesheets
    : timesheets.filter((t) => t.status === filter);

  const counts = {
    all: timesheets.length,
    submitted: timesheets.filter((t) => t.status === 'submitted').length,
    under_review: timesheets.filter((t) => t.status === 'under_review').length,
    approved: timesheets.filter((t) => t.status === 'approved').length,
    rejected: timesheets.filter((t) => t.status === 'rejected').length,
  };

  const totalValue = timesheets
    .filter((t) => ['approved', 'invoiced'].includes(t.status))
    .reduce((s, t) => s + Number(t.total_amount || 0), 0);
  const totalHours = timesheets
    .filter((t) => ['approved', 'invoiced'].includes(t.status))
    .reduce((s, t) => s + Number(t.total_hours || 0), 0);

  const filterPills = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'submitted', label: 'Submitted', count: counts.submitted },
    { key: 'under_review', label: 'Under Review', count: counts.under_review },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  // Only approved (not yet invoiced) timesheets are selectable
  const selectableTimesheets = filteredTimesheets.filter((t) => t.status === 'approved');
  const allSelected = selectableTimesheets.length > 0 && selectableTimesheets.every((t) => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableTimesheets.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0 || !profile) return;
    setBulkLoading(true);
    setBulkResult(null);
    setError(null);

    const selected = timesheets.filter((t) => selectedIds.has(t.id) && t.status === 'approved');
    const generatedInvoices: { id: string; number: string }[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (const ts of selected) {
      try {
        const billableAmount = Number(ts.billable_hours || 0) * Number(ts.hourly_rate || 0);

        if (billableAmount <= 0) {
          // Approve without invoice — just mark as invoiced
          const { error: statusErr } = await supabase
            .from('timesheets')
            .update({ status: 'invoiced' })
            .eq('id', ts.id);
          if (statusErr) errors.push(`${ts.reference}: ${statusErr.message}`);
          else skipped++;
          continue;
        }

        // Check for an existing open invoice for this freelancer + assignment
        const { data: existing } = await supabase
          .from('invoices')
          .select('id, status, subtotal, vat_amount, total_amount, paid_amount, balance_due, invoice_number')
          .eq('freelancer_id', ts.freelancer_id)
          .eq('assignment_id', ts.assignment_id)
          .in('status', ['draft', 'issued', 'part_paid'])
          .order('created_at', { ascending: false })
          .limit(1);

        let targetInvoiceId: string;
        let targetInvoiceNumber: string;

        if (existing && existing.length > 0) {
          // Add to existing invoice
          targetInvoiceId = existing[0].id;
          targetInvoiceNumber = existing[0].invoice_number;
          const inv = existing[0];

          const newSubtotal = Number(inv.subtotal || 0) + billableAmount;
          const vatRate = 20;
          const newVat = Number((newSubtotal * vatRate / 100).toFixed(2));
          const newTotal = Number((newSubtotal + newVat).toFixed(2));
          const newBalance = Number((newTotal - Number(inv.paid_amount || 0)).toFixed(2));

          const { data: maxSort } = await supabase
            .from('invoice_items')
            .select('sort_order')
            .eq('invoice_id', targetInvoiceId)
            .order('sort_order', { ascending: false })
            .limit(1);
          const nextSort = (maxSort && maxSort.length > 0 ? Number(maxSort[0].sort_order) : 0) + 1;

          const periodLabel = `${new Date(ts.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(ts.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
          const { error: itemError } = await supabase.from('invoice_items').insert({
            invoice_id: targetInvoiceId,
            item_type: 'timesheet',
            description: `Timesheet ${ts.reference}: ${periodLabel}`,
            quantity: Number(ts.billable_hours),
            unit_price: Number(ts.hourly_rate),
            amount: billableAmount,
            timesheet_id: ts.id,
            sort_order: nextSort,
          });
          if (itemError) throw itemError;

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
        } else {
          // Create new invoice
          const invNumber = generateInvoiceNumber();
          targetInvoiceNumber = invNumber;
          const vatRate = 20;
          const vatAmount = Number((billableAmount * vatRate / 100).toFixed(2));
          const totalAmount = Number((billableAmount + vatAmount).toFixed(2));
          const issueDate = new Date().toISOString().split('T')[0];
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { data: newInv, error: invCreateError } = await supabase
            .from('invoices')
            .insert({
              freelancer_id: ts.freelancer_id,
              assignment_id: ts.assignment_id,
              invoice_number: invNumber,
              reference: ts.assignment?.reference || null,
              issue_date: issueDate,
              due_date: dueDate,
              status: 'issued',
              currency: ts.currency || 'GBP',
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

          const periodLabel = `${new Date(ts.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(ts.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
          const { error: itemError } = await supabase.from('invoice_items').insert({
            invoice_id: targetInvoiceId,
            item_type: 'timesheet',
            description: `Timesheet ${ts.reference}: ${periodLabel}`,
            quantity: Number(ts.billable_hours),
            unit_price: Number(ts.hourly_rate),
            amount: billableAmount,
            timesheet_id: ts.id,
            sort_order: 1,
          });
          if (itemError) throw itemError;
        }

        // Mark timesheet as invoiced
        const { error: invoicedError } = await supabase
          .from('timesheets')
          .update({ status: 'invoiced' })
          .eq('id', ts.id);

        if (invoicedError) throw invoicedError;

        // Check if we already have this invoice in our results (for accumulating multiple timesheets into one invoice)
        const alreadyListed = generatedInvoices.find((gi) => gi.id === targetInvoiceId);
        if (!alreadyListed) {
          generatedInvoices.push({ id: targetInvoiceId, number: targetInvoiceNumber });
        }
      } catch (err: any) {
        errors.push(`${ts.reference}: ${err.message}`);
      }
    }

    setBulkResult({ invoices: generatedInvoices, skipped, errors });
    setBulkLoading(false);
    setSelectedIds(new Set());

    // Refresh the list
    const { data: fresh, error: refreshErr } = await supabase
      .from('timesheets')
      .select('*, freelancer:profiles!timesheets_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)')
      .order('created_at', { ascending: false });
    if (!refreshErr) setTimesheets(fresh || []);
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

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-1">Timesheet Review</h1>
            <p className="text-sm text-dfp-stone-500 mb-6">Review and approve freelancer timesheets.</p>
          </div>

          {/* Bulk generate button */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkGenerate}
              disabled={bulkLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {bulkLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <i className="ri-bill-line"></i>
                  Generate Invoice{selectedIds.size > 1 ? `s (${selectedIds.size})` : ''}
                </>
              )}
            </button>
          )}
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>}

        {/* Bulk result */}
        {bulkResult && (
          <div className={`p-4 rounded-xl text-sm mb-6 ${bulkResult.errors.length > 0 ? 'bg-amber-50 border border-amber-100 text-amber-700' : 'bg-dfp-green-50 border border-dfp-green-100 text-dfp-green-700'}`}>
            <p className="font-semibold mb-2">
              {bulkResult.invoices.length} invoice{bulkResult.invoices.length !== 1 ? 's' : ''} generated
              {bulkResult.skipped > 0 && ` · ${bulkResult.skipped} skipped (no billable hours)`}
              {bulkResult.errors.length > 0 && ` · ${bulkResult.errors.length} error${bulkResult.errors.length !== 1 ? 's' : ''}`}
            </p>
            {bulkResult.invoices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {bulkResult.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/admin/invoices/${inv.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-dfp-green-200 text-xs font-medium text-dfp-green-700 hover:bg-dfp-green-50 cursor-pointer"
                  >
                    <i className="ri-bill-line text-[10px]"></i>
                    {inv.number}
                    <i className="ri-arrow-right-line text-[10px]"></i>
                  </Link>
                ))}
              </div>
            )}
            {bulkResult.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-600 mt-1">{e}</p>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending Review', value: counts.submitted.toString(), icon: 'ri-hourglass-line', color: 'bg-amber-50 text-amber-600' },
            { label: 'Approved', value: counts.approved.toString(), icon: 'ri-check-double-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
            { label: 'Approved Hours', value: totalHours.toFixed(0), icon: 'ri-timer-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
            { label: 'Approved Value', value: `£${totalValue.toLocaleString('en-GB')}`, icon: 'ri-bank-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <i className={`${card.icon} text-base`}></i>
              </div>
              <p className="text-xl font-bold text-dfp-stone-900">{card.value}</p>
              <p className="text-[11px] text-dfp-stone-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === pill.key ? 'bg-dfp-green-600 text-white' : 'bg-white text-dfp-stone-500 hover:bg-dfp-stone-50 border border-dfp-stone-200'
              }`}
            >
              {pill.label} <span className="ml-1 opacity-60">{pill.count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredTimesheets.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-time-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No timesheets found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
            {/* Bulk select header — only show when there are approved timesheets */}
            {selectableTimesheets.length > 0 && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-dfp-green-50/50 border-b border-dfp-stone-100">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer whitespace-nowrap"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-dfp-green-600 border-dfp-green-600' : 'border-dfp-stone-300'}`}>
                    {allSelected && <i className="ri-check-line text-[10px] text-white"></i>}
                  </div>
                  {allSelected ? 'Deselect all' : `Select all (${selectableTimesheets.length})`}
                </button>
              </div>
            )}

            <div className="divide-y divide-dfp-stone-100">
              {filteredTimesheets.map((ts) => {
                const s = statusMap[ts.status] || statusMap.draft;
                const isSelectable = ts.status === 'approved';
                const isSelected = selectedIds.has(ts.id);

                return (
                  <div key={ts.id} className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-dfp-stone-50`}>
                    {/* Checkbox + content */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isSelectable ? (
                        <button
                          onClick={() => toggleSelect(ts.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${isSelected ? 'bg-dfp-green-600 border-dfp-green-600' : 'border-dfp-stone-300 hover:border-dfp-green-400'}`}
                        >
                          {isSelected && <i className="ri-check-line text-[10px] text-white"></i>}
                        </button>
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0"></div>
                      )}

                      <Link to={`/admin/timesheets/${ts.id}`} className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-dfp-stone-50 flex items-center justify-center flex-shrink-0">
                          <i className="ri-calendar-check-line text-dfp-stone-500"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dfp-stone-900">
                            {ts.freelancer?.first_name} {ts.freelancer?.last_name}
                          </p>
                          <p className="text-xs text-dfp-stone-400 mt-0.5">
                            {ts.reference} · {ts.assignment?.title || '—'} · {new Date(ts.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(ts.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </Link>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-dfp-stone-900">{Number(ts.total_hours || 0).toFixed(1)}h</p>
                        <p className="text-xs text-dfp-stone-400">{ts.currency} {Number(ts.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
                      <i className="ri-arrow-right-s-line text-dfp-stone-400"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}