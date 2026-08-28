import { ApplicationFormData } from '../page';

const COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Ireland', 'New Zealand', 'Singapore', 'Other'];
const TIMEZONES = ['GMT (UTC+0)', 'CET (UTC+1)', 'EET (UTC+2)', 'EST (UTC-5)', 'CST (UTC-6)', 'PST (UTC-8)', 'AEST (UTC+10)', 'Other'];
const LANGUAGES = ['English', 'French', 'German', 'Spanish', 'Italian', 'Dutch', 'Portuguese', 'Swedish', 'Norwegian', 'Danish', 'Polish', 'Arabic', 'Mandarin', 'Japanese', 'Other'];

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step1Personal({ data, onChange }: Props) {
  const toggleLanguage = (lang: string) => {
    const current = data.languages || [];
    const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang];
    onChange({ languages: updated });
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Personal Details</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Tell us about yourself so we can match you with the right opportunities.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Preferred Name</label>
          <input type="text" value={data.preferred_name || ''} onChange={(e) => onChange({ preferred_name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="What should we call you?" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Telephone</label>
          <input type="tel" value={data.telephone || ''} onChange={(e) => onChange({ telephone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="+44 7..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Country</label>
          <select value={data.country || ''} onChange={(e) => onChange({ country: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            <option value="">Select country</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">City or Region</label>
          <input type="text" value={data.city_region || ''} onChange={(e) => onChange({ city_region: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="e.g. London" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Timezone</label>
          <select value={data.timezone || ''} onChange={(e) => onChange({ timezone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            <option value="">Select timezone</option>
            {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Profile Photo URL (optional)</label>
          <input type="text" value={data.preferred_name || ''} onChange={() => {}} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Photo upload coming in later phase" disabled />
          <p className="text-[11px] text-dfp-stone-400 mt-1">Photo upload will be available in a future update.</p>
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Languages</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const selected = (data.languages || []).includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selected ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-500 border border-dfp-stone-200 hover:border-dfp-stone-300'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Professional Summary</label>
        <textarea
          value={data.bio || ''}
          onChange={(e) => onChange({ bio: e.target.value })}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white resize-none"
          placeholder="Brief overview of your professional background and what you specialise in..."
        ></textarea>
        <p className="text-[11px] text-dfp-stone-400 mt-1">{(data.bio || '').length}/500 characters</p>
      </div>
    </div>
  );
}