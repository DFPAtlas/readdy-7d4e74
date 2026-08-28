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

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  status: string;
  notes: string;
  invoice: { id: string; invoice_number: string; freelancer: { first_name: string; last_name: string } } | null;
}

export default function AdminPaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('payments')
          .select('*, invoice:invoices(id, invoice_number, freelancer:profiles!invoices_freelancer_id_fkey(first_name, last_name))')
          .order('payment_date', { ascending: false })
          .limit(50);

        if (cancelled) return;
        if (fetchError) throw fetchError;
        setPayments(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Group by month
  const grouped: Record<string, PaymentData[]> = {};
  payments.forEach((p) => {
    const month = p.payment_date ? p.payment_date.substring(0, 7) : 'unknown';
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(p);
  });

  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Payment Records</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">All recorded payments across invoices.</p>
          </div>
          <Link
            to="/admin/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-dfp-stone-200 text-dfp-stone-700 text-sm font-medium rounded-lg hover:bg-dfp-stone-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-bill-line"></i> All Invoices
          </Link>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">{error}</div>}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Payments', value: payments.length.toString(), icon: 'ri-bank-line', color: 'bg-dfp-stone-50 text-dfp-stone-600' },
            { label: 'Total Received', value: `£${totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, icon: 'ri-check-double-line', color: 'bg-dfp-green-50 text-dfp-green-600' },
            { label: 'Avg Payment', value: payments.length > 0 ? `£${(totalAmount / payments.length).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` : '£0.00', icon: 'ri-funds-line', color: 'bg-dfp-blue-50 text-dfp-blue-600' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-dfp-stone-200 p-4">
              <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <i className={`${card.icon} text-base`}></i>
              </div>
              <p className="text-lg font-bold text-dfp-stone-900 truncate">{card.value}</p>
              <p className="text-[11px] text-dfp-stone-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Payments grouped by month */}
        {sortedMonths.length === 0 ? (
          <div className="bg-white rounded-xl border border-dfp-stone-200 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-4">
              <i className="ri-bank-line text-2xl text-dfp-stone-300"></i>
            </div>
            <p className="text-sm text-dfp-stone-500">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((month) => {
              const monthTotal = grouped[month].reduce((s, p) => s + Number(p.amount), 0);
              return (
                <div key={month}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-dfp-stone-900">
                      {new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="h-px flex-1 bg-dfp-stone-100"></span>
                    <span className="text-xs font-medium text-dfp-green-700">£{monthTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-dfp-stone-200 overflow-hidden">
                    <div className="divide-y divide-dfp-stone-100">
                      {grouped[month].map((p) => (
                        <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-dfp-green-50 flex items-center justify-center">
                              <i className="ri-check-line text-dfp-green-600 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-dfp-stone-700">
                                {p.currency} {Number(p.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-dfp-stone-400">
                                {p.invoice?.invoice_number} · {p.invoice?.freelancer?.first_name} {p.invoice?.freelancer?.last_name} · Ref: {p.payment_reference || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-dfp-stone-400">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-[10px] text-dfp-stone-400 mt-0.5">{p.payment_method}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}