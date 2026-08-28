import { useState } from 'react';
import { ApplicationFormData } from '../page';

const CATEGORIES = [
  'Web Development', 'UX and UI Design', 'Software Testing and UAT',
  'AI and Automation', 'Data and Research', 'Content and Documentation',
  'Cybersecurity and Technical Operations', 'Business and Project Support',
];

const LEVELS = ['junior', 'mid', 'senior', 'lead'];

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step3Skills({ data, onChange }: Props) {
  const [skillInput, setSkillInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const addItem = (field: 'skills' | 'tools_platforms' | 'certifications' | 'preferred_project_types', value: string) => {
    const current = (data[field] as string[]) || [];
    if (value.trim() && !current.includes(value.trim())) {
      onChange({ [field]: [...current, value.trim()] });
    }
  };

  const removeItem = (field: 'skills' | 'tools_platforms' | 'certifications' | 'preferred_project_types', value: string) => {
    const current = (data[field] as string[]) || [];
    onChange({ [field]: current.filter((i) => i !== value) });
  };

  const handleSkillKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem('skills', skillInput); setSkillInput(''); }
  };

  const handleToolKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem('tools_platforms', toolInput); setToolInput(''); }
  };

  const handleCertKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem('certifications', certInput); setCertInput(''); }
  };

  const toggleAdditionalCategory = (cat: string) => {
    const current = data.additional_categories || [];
    if (current.includes(cat)) {
      onChange({ additional_categories: current.filter((c) => c !== cat) });
    } else {
      onChange({ additional_categories: [...current, cat] });
    }
  };

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Skills and Experience</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Help us understand your expertise so we can match you with relevant projects.</p>

      {/* Primary category */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-2">Primary Category</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange({ primary_category: cat })}
              className={`px-4 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                data.primary_category === cat
                  ? 'bg-dfp-blue-100 text-dfp-blue-700 border border-dfp-blue-200 font-medium'
                  : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200 hover:border-dfp-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Additional categories */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-2">Additional Categories (optional)</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c !== data.primary_category).map((cat) => {
            const sel = (data.additional_categories || []).includes(cat);
            return (
              <button key={cat} onClick={() => toggleAdditionalCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap ${
                sel ? 'bg-dfp-blue-50 text-dfp-blue-600 border border-dfp-blue-200' : 'bg-dfp-stone-50 text-dfp-stone-500 border border-dfp-stone-200'
              }`}>{cat}</button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-2">Skills</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillKey} className="flex-1 px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="React, TypeScript, Python..." />
          <button onClick={() => { addItem('skills', skillInput); setSkillInput(''); }} className="px-4 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-sm rounded-lg hover:bg-dfp-stone-200 transition-colors cursor-pointer whitespace-nowrap">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.skills || []).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-dfp-green-50 text-dfp-green-700 text-xs rounded-full border border-dfp-green-100">
              {s}
              <button onClick={() => removeItem('skills', s)} className="hover:text-red-500 cursor-pointer"><i className="ri-close-line"></i></button>
            </span>
          ))}
        </div>
      </div>

      {/* Experience level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Years of Experience</label>
          <input type="number" min="0" max="50" value={data.experience_years || 0} onChange={(e) => onChange({ experience_years: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Experience Level</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => onChange({ experience_level: l })} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                data.experience_level === l ? 'bg-dfp-blue-100 text-dfp-blue-700 border border-dfp-blue-200' : 'bg-dfp-stone-50 text-dfp-stone-600 border border-dfp-stone-200'
              }`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-dfp-stone-700 mb-2">Tools and Platforms</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={toolInput} onChange={(e) => setToolInput(e.target.value)} onKeyDown={handleToolKey} className="flex-1 px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="GitHub, Figma, AWS..." />
          <button onClick={() => { addItem('tools_platforms', toolInput); setToolInput(''); }} className="px-4 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-sm rounded-lg hover:bg-dfp-stone-200 transition-colors cursor-pointer whitespace-nowrap">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.tools_platforms || []).map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-dfp-stone-100 text-dfp-stone-600 text-xs rounded-full border border-dfp-stone-200">
              {t}
              <button onClick={() => removeItem('tools_platforms', t)} className="hover:text-red-500 cursor-pointer"><i className="ri-close-line"></i></button>
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-xs font-medium text-dfp-stone-700 mb-2">Certifications</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={handleCertKey} className="flex-1 px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="AWS Certified, Scrum Master..." />
          <button onClick={() => { addItem('certifications', certInput); setCertInput(''); }} className="px-4 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-sm rounded-lg hover:bg-dfp-stone-200 transition-colors cursor-pointer whitespace-nowrap">Add</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.certifications || []).map((c) => (
            <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-dfp-blue-50 text-dfp-blue-700 text-xs rounded-full border border-dfp-blue-100">
              {c}
              <button onClick={() => removeItem('certifications', c)} className="hover:text-red-500 cursor-pointer"><i className="ri-close-line"></i></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}