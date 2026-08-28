import { ApplicationFormData } from '../page';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PREFERENCES = ['remote', 'on_site', 'hybrid'];

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step4Availability({ data, onChange }: Props) {
  const toggleDay = (day: string) => {
    const current = data.preferred_days || [];
    if (current.includes(day)) {
      onChange({ preferred_days: current.filter((d) => d !== day) });
    } else {
      onChange({ preferred_days: [...current, day] });
    }
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Availability and Rates</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Set your availability and rate expectations so we can match you with suitable assignments.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Current Availability</label>
          <select value={data.availability_status || ''} onChange={(e) => onChange({ availability_status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            <option value="">Select...</option>
            <option value="available">Available for new work</option>
            <option value="limited">Limited availability</option>
            <option value="unavailable">Not currently available</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Hours Available Per Week</label>
          <input type="number" min="0" max="80" value={data.hours_per_week || 0} onChange={(e) => onChange({ hours_per_week: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Preferred Working Days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const sel = (data.preferred_days || []).includes(day);
            return (
              <button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                sel ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
              }`}>{day}</button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Remote / On-site Preference</label>
          <div className="flex gap-2">
            {PREFERENCES.map((p) => (
              <button key={p} onClick={() => onChange({ remote_preference: p })} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                data.remote_preference === p ? 'bg-dfp-blue-100 text-dfp-blue-700 border border-dfp-blue-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
              }`}>{p.replace('_', ' ')}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Travel Availability</label>
          <div className="flex gap-3">
            <button onClick={() => onChange({ travel_available: true })} className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              data.travel_available ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
            }`}>Yes</button>
            <button onClick={() => onChange({ travel_available: false })} className={`px-5 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              data.travel_available === false ? 'bg-dfp-green-100 text-dfp-green-700 border border-dfp-green-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
            }`}>No</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Earliest Start Date</label>
          <input type="date" value={data.earliest_start_date || ''} onChange={(e) => onChange({ earliest_start_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer" />
        </div>
      </div>

      <hr className="border-dfp-stone-100 my-6" />

      <h3 className="font-display text-base font-semibold text-dfp-stone-900 mb-4">Rate Expectations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Hourly Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-dfp-stone-400">£</span>
            <input type="number" min="0" value={data.hourly_rate || ''} onChange={(e) => onChange({ hourly_rate: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="0" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Day Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-dfp-stone-400">£</span>
            <input type="number" min="0" value={data.day_rate || ''} onChange={(e) => onChange({ day_rate: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="0" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Currency</label>
          <select value={data.currency || 'GBP'} onChange={(e) => onChange({ currency: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white cursor-pointer">
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.fixed_price_accepted || false} onChange={(e) => onChange({ fixed_price_accepted: e.target.checked })} className="w-4 h-4 rounded border-dfp-stone-300 text-dfp-green-600 focus:ring-dfp-green-500 cursor-pointer" />
          <span className="text-sm text-dfp-stone-600">I accept fixed-price project work</span>
        </label>
      </div>
    </div>
  );
}