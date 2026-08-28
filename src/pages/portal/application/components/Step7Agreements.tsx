import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { ApplicationFormData } from '../page';

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step7Agreements({ data, onChange }: Props) {
  const { profile } = useAuth();
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const agreementTypes = [
    { key: 'privacy_notice', label: 'Privacy Notice', required: true, href: '/privacy', desc: 'I have read and understood the DFP Privacy Notice and agree to the processing of my personal data as described.' },
    { key: 'freelancer_terms', label: 'Freelancer Application Terms', required: true, href: '/freelancer-terms', desc: 'I agree to the DFP Freelancer Network application terms and conditions.' },
    { key: 'nda', label: 'Non-Disclosure Agreement', required: false, href: null, desc: 'NDA acceptance will be required before starting any client assignment.', comingSoon: true },
    { key: 'contractor_agreement', label: 'Contractor Agreement', required: false, href: null, desc: 'The full contractor agreement will be provided after application approval.', comingSoon: true },
    { key: 'security_induction', label: 'Security Induction', required: false, href: null, desc: 'Security induction training will be required before accessing client systems.', comingSoon: true },
  ];

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.from('freelancer_agreements').select('*').eq('user_id', profile.id);
      if (!cancelled && data) {
        const map: Record<string, boolean> = {};
        data.forEach((a: any) => { map[a.agreement_type] = a.accepted; });
        setAgreements(map);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const toggleAgreement = async (type: string) => {
    const newVal = !agreements[type];
    setAgreements({ ...agreements, [type]: newVal });
    setSaving(true);
    await supabase.from('freelancer_agreements').upsert({
      user_id: profile?.id,
      agreement_type: type,
      accepted: newVal,
      accepted_at: newVal ? new Date().toISOString() : null,
      version: '1.0',
    }, { onConflict: 'user_id,agreement_type' });
    setSaving(false);
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Agreements</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Review and accept the required agreements to proceed with your application.</p>

      <div className="space-y-3">
        {agreementTypes.map((ag) => (
          <div key={ag.key} className={`p-4 rounded-xl border ${ag.required ? 'border-dfp-stone-200 bg-white' : 'border-dfp-stone-100 bg-dfp-stone-50/50'}`}>
            <div className="flex items-start gap-3">
              {ag.comingSoon ? (
                <div className="w-5 h-5 rounded border-2 border-dfp-stone-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-time-line text-[10px] text-dfp-stone-400"></i>
                </div>
              ) : (
                <button
                  onClick={() => toggleAgreement(ag.key)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors cursor-pointer ${
                    agreements[ag.key] ? 'bg-dfp-green-600 border-dfp-green-600' : 'border-dfp-stone-300 hover:border-dfp-green-400'
                  }`}
                  disabled={saving}
                >
                  {agreements[ag.key] && <i className="ri-check-line text-white text-xs"></i>}
                </button>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-dfp-stone-900">{ag.label}</h4>
                  {ag.required && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600 whitespace-nowrap">Required</span>}
                  {ag.comingSoon && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-dfp-stone-100 text-dfp-stone-500 whitespace-nowrap">Later Phase</span>}
                </div>
                <p className="text-xs text-dfp-stone-500 mt-1">{ag.desc}</p>
                {ag.href && (
                  <Link to={ag.href} className="inline-flex items-center gap-1 text-xs text-dfp-blue-600 hover:text-dfp-blue-700 mt-1.5 cursor-pointer">
                    <i className="ri-external-link-line"></i> Read document
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}