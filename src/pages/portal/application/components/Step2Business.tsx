import { ApplicationFormData } from '../page';

const BUSINESS_TYPES = [
  { value: 'freelancer', label: 'Individual Freelancer' },
  { value: 'sole_trader', label: 'Sole Trader' },
  { value: 'limited_company', label: 'Limited Company' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
];

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step2Business({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Business Details</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Your business structure helps us set up the right invoicing and compliance arrangements.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Business Type</label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => onChange({ business_type: bt.value })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  data.business_type === bt.value
                    ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200'
                    : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200 hover:border-dfp-stone-300'
                }`}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Trading Name</label>
          <input type="text" value={data.trading_name || ''} onChange={(e) => onChange({ trading_name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Your trading name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Registered Company Name</label>
          <input type="text" value={data.company_name || ''} onChange={(e) => onChange({ company_name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="If applicable" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Company Number</label>
          <input type="text" value={data.company_number || ''} onChange={(e) => onChange({ company_number: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="If applicable" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">VAT Registered</label>
          <div className="flex gap-3">
            <button
              onClick={() => onChange({ vat_registered: true })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                data.vat_registered ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
              }`}
            >Yes</button>
            <button
              onClick={() => onChange({ vat_registered: false, vat_number: '' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                data.vat_registered === false ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
              }`}
            >No</button>
          </div>
        </div>
        {data.vat_registered && (
          <div>
            <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">VAT Number</label>
            <input type="text" value={data.vat_number || ''} onChange={(e) => onChange({ vat_number: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="GB..." />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Website</label>
          <input type="url" value={data.website || ''} onChange={(e) => onChange({ website: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Professional Profile (LinkedIn etc.)</label>
          <input type="url" value={data.professional_profile_url || ''} onChange={(e) => onChange({ professional_profile_url: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="https://..." />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Business Address</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" value={(data.business_address || {} as any).line1 || ''} onChange={(e) => onChange({ business_address: { ...(data.business_address || {}), line1: e.target.value } })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Address line 1" />
          <input type="text" value={(data.business_address || {} as any).line2 || ''} onChange={(e) => onChange({ business_address: { ...(data.business_address || {}), line2: e.target.value } })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Address line 2" />
          <input type="text" value={(data.business_address || {} as any).city || ''} onChange={(e) => onChange({ business_address: { ...(data.business_address || {}), city: e.target.value } })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="City" />
          <input type="text" value={(data.business_address || {} as any).postcode || ''} onChange={(e) => onChange({ business_address: { ...(data.business_address || {}), postcode: e.target.value } })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Postcode" />
        </div>
      </div>
    </div>
  );
}