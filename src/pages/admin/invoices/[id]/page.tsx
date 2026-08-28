import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface Invoice {
  id: string;
  invoice_number: string;
  reference: string;
  issue_date: string;
  due_date: string;
  status: string;
  currency: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_terms: string;
  notes: string;
  paid_at: string;
  freelancer: { id: string; first_name: string; last_name: string; email: string } | null;
  assignment: { id: string; title: string; reference: string } | null;
}

interface InvoiceItem {
  id: string;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  timesheet_id: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  status: string;
  notes: string;
  created_at: string;
}

interface CreditNote {
  id: string;
  credit_note_number: string;
  amount: number;
  reason: string;
  status: string;
  issued_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-dfp-stone-100 text-dfp-stone-600' },
  issued: { label: 'Issued', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
  part_paid: { label: 'Part Paid', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Paid', color: 'bg-dfp-green-100 text-dfp-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-dfp-stone-100 text-dfp-stone-400' },
};

const itemTypeLabels: Record<string, string> = {
  timesheet: 'Timesheet Hours',
  fixed_fee: 'Fixed Fee',
  milestone: 'Milestone Payment',
  expense: 'Expense',
  adjustment: 'Adjustment',
};

export default function AdminInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Status change
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invRes, itemsRes, payRes, cnRes] = await Promise.all([
          supabase.from('invoices').select('*, freelancer:profiles!invoices_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)').eq('id', id).maybeSingle(),
          supabase.from('invoice_items').select('*').eq('invoice_id', id).order('sort_order'),
          supabase.from('payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: false }),
          supabase.from('credit_notes').select('*').eq('invoice_id', id).order('issued_at', { ascending: false }),
        ]);
        if (cancelled) return;
        if (invRes.error) throw invRes.error;
        if (!invRes.data) { setError('Invoice not found'); return; }
        setInvoice(invRes.data);
        setItems(itemsRes.data || []);
        setPayments(payRes.data || []);
        setCreditNotes(cnRes.data || []);
        setPayAmount(Number(invRes.data.balance_due || 0));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const recordPayment = async () => {
    if (!invoice || !profile || payAmount <= 0) return;
    setSubmitting(true);
    setError(null);
    setActionMsg(null);
    try {
      const { error: payError } = await supabase.from('payments').insert({
        invoice_id: invoice.id,
        amount: payAmount,
        currency: invoice.currency,
        payment_method: payMethod,
        payment_reference: payRef || null,
        payment_date: payDate,
        status: 'completed',
        recorded_by: profile.id,
        notes: payNotes || null,
      });
      if (payError) throw payError;

      const newPaid = Number(invoice.paid_amount || 0) + payAmount;
      const newBalance = Math.max(0, Number(invoice.total_amount || 0) - newPaid);
      const newStatus = newBalance <= 0 ? 'paid' : 'part_paid';

      const { error: invError } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaid,
          balance_due: newBalance,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_at,
        })
        .eq('id', invoice.id);
      if (invError) throw invError;

      // Refresh data
      const [invRes, payRes] = await Promise.all([
        supabase.from('invoices').select('*, freelancer:profiles!invoices_freelancer_id_fkey(id, first_name, last_name, email), assignment:assignments(id, title, reference)').eq('id', id).maybeSingle(),
        supabase.from('payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: false }),
      ]);
      if (invRes.data) setInvoice(invRes.data);
      setPayments(payRes.data || []);

      setActionMsg(`Payment of ${invoice.currency} ${payAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} recorded.`);
      setShowPaymentForm(false);
      setPayRef('');
      setPayNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice || !profile) return;
    setStatusActionLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: newStatus,
          cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : null,
        })
        .eq('id', invoice.id);
      if (updateError) throw updateError;
      setInvoice({ ...invoice, status: newStatus, cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : invoice.cancelled_at });
      setActionMsg(`Invoice ${newStatus === 'cancelled' ? 'cancelled' : 'updated to ' + newStatus.replace('_', ' ')}.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusActionLoading(false);
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

  if (error || !invoice) {
    return (
      <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-dfp-stone-600 mb-4">{error || 'Not found'}</p>
          <Link to="/admin/invoices" className="text-sm font-medium text-dfp-green-700">Back to invoices</Link>
        </div>
      </PortalLayout>
    );
  }

  const s = statusMap[invoice.status] || statusMap.draft;
  const daysUntilDue = invoice.due_date ? Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <PortalLayout sidebarItems={adminSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to invoices
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-[10px] font-mono font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{invoice.invoice_number}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </div>
              <h1 className="font-display text-xl font-bold text-dfp-stone-900">Invoice {invoice.invoice_number}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-dfp-stone-500 mt-1">
                <span>{invoice.freelancer?.first_name} {invoice.freelancer?.last_name}</span>
                <span>·</span>
                <span className="text-xs">{invoice.freelancer?.email}</span>
              </div>
              <p className="text-sm text-dfp-stone-500 mt-1">{invoice.assignment?.title || '—'} · {invoice.assignment?.reference}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Issue Date</p>
              <p className="text-sm font-medium text-dfp-stone-700">{new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Due Date</p>
              <p className={`text-sm font-medium ${daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-600' : 'text-dfp-stone-700'}`}>
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Terms</p>
              <p className="text-sm font-medium text-dfp-stone-700">{invoice.payment_terms}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Total</p>
              <p className="text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.total_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Balance</p>
              <p className="text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.balance_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dfp-stone-100">
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                {!showPaymentForm && (
                  <button
                    onClick={() => { setShowPaymentForm(true); setPayAmount(Number(invoice.balance_due || 0)); }}
                    className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-add-line mr-1.5"></i> Record Payment
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={statusActionLoading}
                  className="px-4 py-2 bg-white border border-dfp-stone-200 text-dfp-stone-600 text-sm font-medium rounded-lg hover:bg-dfp-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  Cancel Invoice
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="p-4 bg-dfp-green-50 border border-dfp-green-100 rounded-xl text-sm text-dfp-green-700 mb-6">{actionMsg}</div>
        )}

        {/* Payment form */}
        {showPaymentForm && (
          <div className="bg-white rounded-xl border border-dfp-green-200 ring-1 ring-dfp-green-500/20 p-5 md:p-6 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Record Payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Amount</label>
                <input type="number" value={payAmount || ''} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} step="0.01" min="0" max={Number(invoice.balance_due)} className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 cursor-pointer">
                  <option>Bank Transfer</option>
                  <option>BACS</option>
                  <option>Faster Payments</option>
                  <option>CHAPS</option>
                  <option>Cheque</option>
                  <option>Stripe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Reference</label>
                <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Payment ref..." className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 placeholder:text-dfp-stone-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-dfp-stone-500 mb-1.5">Payment Date</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-dfp-stone-200 text-sm text-dfp-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowPaymentForm(false)} className="px-4 py-2 text-sm font-medium text-dfp-stone-600 hover:text-dfp-stone-900 cursor-pointer">Cancel</button>
              <button onClick={recordPayment} disabled={submitting || payAmount <= 0} className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer">
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        )}

        {/* Line items */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-dfp-stone-100">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Line Items</h2>
          </div>
          <div className="p-5">
            {items.length === 0 ? (
              <p className="text-sm text-dfp-stone-400">No line items.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dfp-stone-100">
                    <th className="text-left py-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Description</th>
                    <th className="text-center py-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Rate</th>
                    <th className="text-right py-2 text-[10px] font-medium text-dfp-stone-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-dfp-stone-50">
                      <td className="py-2.5 pr-3">
                        <p className="text-dfp-stone-700">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-dfp-stone-400">{itemTypeLabels[item.item_type] || item.item_type}</span>
                          {item.timesheet_id && (
                            <Link to={`/admin/timesheets/${item.timesheet_id}`} className="text-[10px] text-dfp-green-600 hover:text-dfp-green-700 underline cursor-pointer">
                              View timesheet
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-dfp-stone-600">{Number(item.quantity).toFixed(1)}</td>
                      <td className="py-2.5 text-right text-dfp-stone-600">{invoice.currency} {Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-medium text-dfp-stone-900">{invoice.currency} {Number(item.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="py-2 text-right text-sm text-dfp-stone-500">Subtotal</td><td className="py-2 text-right text-sm font-medium text-dfp-stone-900">{invoice.currency} {Number(invoice.subtotal).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
                  {Number(invoice.vat_amount) > 0 && <tr><td colSpan={3} className="py-2 text-right text-sm text-dfp-stone-500">VAT ({Number(invoice.vat_rate)}%)</td><td className="py-2 text-right text-sm font-medium text-dfp-stone-900">{invoice.currency} {Number(invoice.vat_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>}
                  <tr className="border-t-2 border-dfp-stone-200"><td colSpan={3} className="py-3 text-right text-sm font-semibold text-dfp-stone-900">Total</td><td className="py-3 text-right text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.total_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
                  {Number(invoice.paid_amount) > 0 && (
                    <>
                      <tr><td colSpan={3} className="py-2 text-right text-sm text-dfp-green-700">Paid to Date</td><td className="py-2 text-right text-sm font-medium text-dfp-green-700">-{invoice.currency} {Number(invoice.paid_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
                      <tr className="border-t border-dfp-stone-100"><td colSpan={3} className="py-3 text-right text-sm font-semibold text-dfp-stone-900">Balance Due</td><td className="py-3 text-right text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.balance_due).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
                    </>
                  )}
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Payments history */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-dfp-stone-100">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Payment History</h2>
            </div>
            <div className="divide-y divide-dfp-stone-100">
              {payments.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dfp-green-50 flex items-center justify-center">
                      <i className="ri-check-line text-dfp-green-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dfp-stone-700">{p.currency} {Number(p.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-dfp-stone-400">{p.payment_method} · Ref: {p.payment_reference || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dfp-stone-400">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {p.notes && <p className="text-[10px] text-dfp-stone-400 mt-0.5">{p.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit notes */}
        {creditNotes.length > 0 && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-dfp-stone-100">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Credit Notes</h2>
            </div>
            <div className="divide-y divide-dfp-stone-100">
              {creditNotes.map((cn) => (
                <div key={cn.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dfp-stone-700">{cn.credit_note_number}</p>
                    <p className="text-xs text-dfp-stone-400">{cn.reason || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">-{invoice.currency} {Number(cn.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-dfp-stone-400">{new Date(cn.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}