import { ApplicationFormData } from '../page';

interface Props { data: ApplicationFormData; }

export default function Step8Review({ data }: Props) {
  const sections = [
    {
      title: 'Personal Details',
      fields: [
        { label: 'Preferred Name', value: data.preferred_name || '-' },
        { label: 'Telephone', value: data.telephone || '-' },
        { label: 'Country', value: data.country || '-' },
        { label: 'City / Region', value: data.city_region || '-' },
        { label: 'Timezone', value: data.timezone || '-' },
        { label: 'Languages', value: (data.languages || []).join(', ') || '-' },
        { label: 'Professional Summary', value: data.bio || '-', long: true },
      ],
    },
    {
      title: 'Business Details',
      fields: [
        { label: 'Business Type', value: data.business_type ? data.business_type.replace('_', ' ') : '-' },
        { label: 'Trading Name', value: data.trading_name || '-' },
        { label: 'Company Name', value: data.company_name || '-' },
        { label: 'Company Number', value: data.company_number || '-' },
        { label: 'VAT Registered', value: data.vat_registered ? `Yes (${data.vat_number || 'No number'})` : 'No' },
        { label: 'Website', value: data.website || '-' },
        { label: 'Professional Profile', value: data.professional_profile_url || '-' },
      ],
    },
    {
      title: 'Skills and Experience',
      fields: [
        { label: 'Primary Category', value: data.primary_category || '-' },
        { label: 'Additional Categories', value: (data.additional_categories || []).join(', ') || '-' },
        { label: 'Skills', value: (data.skills || []).join(', ') || '-' },
        { label: 'Experience', value: data.experience_years ? `${data.experience_years} years (${data.experience_level || 'Not set'})` : '-' },
        { label: 'Tools & Platforms', value: (data.tools_platforms || []).join(', ') || '-' },
        { label: 'Certifications', value: (data.certifications || []).join(', ') || '-' },
      ],
    },
    {
      title: 'Availability and Rates',
      fields: [
        { label: 'Availability', value: data.availability_status ? data.availability_status.replace('_', ' ') : '-' },
        { label: 'Hours per Week', value: data.hours_per_week || '-' },
        { label: 'Preferred Days', value: (data.preferred_days || []).join(', ') || '-' },
        { label: 'Remote / On-site', value: data.remote_preference ? data.remote_preference.replace('_', ' ') : '-' },
        { label: 'Travel Available', value: data.travel_available ? 'Yes' : 'No' },
        { label: 'Hourly Rate', value: data.hourly_rate ? `£${data.hourly_rate}` : '-' },
        { label: 'Day Rate', value: data.day_rate ? `£${data.day_rate}` : '-' },
        { label: 'Fixed Price', value: data.fixed_price_accepted ? 'Accepted' : 'Not accepted' },
        { label: 'Currency', value: data.currency || 'GBP' },
      ],
    },
  ];

  const missingFields: string[] = [];
  if (!data.preferred_name) missingFields.push('Preferred name');
  if (!data.country) missingFields.push('Country');
  if (!data.timezone) missingFields.push('Timezone');
  if (!data.business_type) missingFields.push('Business type');
  if (!data.primary_category) missingFields.push('Primary category');
  if (!data.skills || data.skills.length === 0) missingFields.push('Skills');
  if (!data.hourly_rate || data.hourly_rate <= 0) missingFields.push('Hourly rate');

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Review and Submit</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Review all your information before submitting. You can go back to any step to make changes.</p>

      {/* Missing fields warning */}
      {missingFields.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
          <div className="flex items-start gap-2">
            <i className="ri-error-warning-line text-amber-600 mt-0.5"></i>
            <div>
              <p className="text-sm font-medium text-amber-800">Some recommended fields are missing</p>
              <p className="text-xs text-amber-600 mt-0.5">You can still submit, but completing these will speed up review: {missingFields.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-dfp-stone-700 mb-3 pb-2 border-b border-dfp-stone-100">{section.title}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {section.fields.map((field) => (
                <div key={field.label} className={field.long ? 'sm:col-span-2' : ''}>
                  <dt className="text-[11px] text-dfp-stone-400 uppercase tracking-wider">{field.label}</dt>
                  <dd className={`text-sm text-dfp-stone-900 mt-0.5 ${field.long ? 'leading-relaxed' : ''}`}>{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-dfp-green-50 border border-dfp-green-100 rounded-xl">
        <p className="text-sm text-dfp-green-800">
          <strong>Before you submit:</strong> Please confirm that all information is accurate and complete. 
          After submission, some fields may be locked. You will be notified if any additional information is required.
        </p>
      </div>
    </div>
  );
}