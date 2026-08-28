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
  cancelled_at: string;
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [invRes, itemsRes, payRes, cnRes] = await Promise.all([
          supabase.from('invoices').select('*, assignment:assignments(id, title, reference)').eq('id', id).maybeSingle(),
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
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !invoice) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Invoice not found'}</p>
          <Link to="/portal/invoices" className="text-sm font-medium text-dfp-green-700">Back to invoices</Link>
        </div>
      </PortalLayout>
    );
  }

  const s = statusMap[invoice.status] || statusMap.draft;
  const daysUntilDue = invoice.due_date ? Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/portal/invoices" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
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
              <p className="text-sm text-dfp-stone-500 mt-1">
                {invoice.assignment?.title || invoice.reference || '—'}
                {invoice.assignment?.reference && ` · ${invoice.assignment.reference}`}
              </p>
            </div>
          </div>

          {/* Dates + amounts grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-dfp-stone-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Issue Date</p>
              <p className="text-sm font-medium text-dfp-stone-700">{new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Due Date</p>
              <p className={`text-sm font-medium ${daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-600' : 'text-dfp-stone-700'}`}>
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                {daysUntilDue !== null && (
                  <span className="ml-1 text-xs">({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`})</span>
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Terms</p>
              <p className="text-sm font-medium text-dfp-stone-700">{invoice.payment_terms || 'Net 30'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Status</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.color}`}>{s.label}</span>
            </div>
          </div>
        </div>

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
                        <span className="text-[10px] text-dfp-stone-400">{itemTypeLabels[item.item_type] || item.item_type}</span>
                      </td>
                      <td className="py-2.5 text-center text-dfp-stone-600">{Number(item.quantity).toFixed(1)}</td>
                      <td className="py-2.5 text-right text-dfp-stone-600">{invoice.currency} {Number(item.unit_price || 0).toFixed(2)}</td>
                      <td className="py-2.5 text-right font-medium text-dfp-stone-900">{invoice.currency} {Number(item.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-sm text-dfp-stone-500">Subtotal</td>
                    <td className="py-2 text-right text-sm font-medium text-dfp-stone-900">{invoice.currency} {Number(invoice.subtotal || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {Number(invoice.vat_amount || 0) > 0 && (
                    <tr>
                      <td colSpan={3} className="py-2 text-right text-sm text-dfp-stone-500">VAT ({Number(invoice.vat_rate || 0)}%)</td>
                      <td className="py-2 text-right text-sm font-medium text-dfp-stone-900">{invoice.currency} {Number(invoice.vat_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-dfp-stone-200">
                    <td colSpan={3} className="py-3 text-right text-sm font-semibold text-dfp-stone-900">Total</td>
                    <td className="py-3 text-right text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.total_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {Number(invoice.paid_amount || 0) > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="py-2 text-right text-sm text-dfp-green-700">Paid to Date</td>
                        <td className="py-2 text-right text-sm font-medium text-dfp-green-700">-{invoice.currency} {Number(invoice.paid_amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="border-t border-dfp-stone-100">
                        <td colSpan={3} className="py-3 text-right text-sm font-semibold text-dfp-stone-900">Balance Due</td>
                        <td className="py-3 text-right text-sm font-bold text-dfp-stone-900">{invoice.currency} {Number(invoice.balance_due || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-dfp-stone-100">
              <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Payments</h2>
            </div>
            <div className="divide-y divide-dfp-stone-100">
              {payments.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dfp-green-50 flex items-center justify-center">
                      <i className="ri-check-line text-dfp-green-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dfp-stone-700">{p.currency} {Number(p.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-dfp-stone-400">Ref: {p.payment_reference || '—'} · {p.payment_method || 'Bank Transfer'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-dfp-stone-400">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Notes */}
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
                    <p className="text-xs text-dfp-stone-400">{cn.reason || 'No reason provided'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">-{invoice.currency} {Number(cn.amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-dfp-stone-400">{new Date(cn.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-2">Notes</h2>
            <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}