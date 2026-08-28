import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import useAuth from '@/hooks/useAuth';
import { ApplicationFormData } from '../page';

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  project_type: string;
  skills_used: string[];
  url: string;
  sort_order: number;
}

interface Props { data: ApplicationFormData; onChange: (d: Partial<ApplicationFormData>) => void; }

export default function Step5Portfolio({ data, onChange }: Props) {
  const { profile } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [skillInput, setSkillInput] = useState('');

  // Current form for new/edit
  const [form, setForm] = useState<PortfolioItem>({
    title: '', description: '', project_type: '', skills_used: [], url: '', sort_order: 0,
  });

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      const { data: items, error } = await supabase.from('freelancer_portfolio_items').select('*').eq('user_id', profile.id).order('sort_order');
      if (!cancelled && !error) setItems(items || []);
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const addSkill = () => {
    if (skillInput.trim() && !form.skills_used.includes(skillInput.trim())) {
      setForm({ ...form, skills_used: [...form.skills_used, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const saveItem = async () => {
    if (!profile || !form.title.trim()) return;
    const payload = { ...form, user_id: profile.id };
    if (editing?.id) {
      await supabase.from('freelancer_portfolio_items').update(payload).eq('id', editing.id);
    } else {
      payload.sort_order = items.length;
      await supabase.from('freelancer_portfolio_items').insert(payload);
    }
    // Refresh
    const { data: refreshed } = await supabase.from('freelancer_portfolio_items').select('*').eq('user_id', profile.id).order('sort_order');
    setItems(refreshed || []);
    setEditing(null);
    setForm({ title: '', description: '', project_type: '', skills_used: [], url: '', sort_order: 0 });
  };

  const deleteItem = async (id: string) => {
    if (!profile) return;
    await supabase.from('freelancer_portfolio_items').delete().eq('id', id);
    setItems(items.filter((i) => i.id !== id));
  };

  const editItem = (item: PortfolioItem) => {
    setEditing(item);
    setForm({ ...item });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-1">Portfolio</h2>
      <p className="text-sm text-dfp-stone-500 mb-6">Add portfolio items to showcase your best work. You can add more after submitting your application.</p>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 bg-dfp-stone-50 rounded-lg border border-dfp-stone-100">
              <div>
                <p className="text-sm font-medium text-dfp-stone-900">{item.title}</p>
                <p className="text-xs text-dfp-stone-500 mt-0.5">{item.project_type}{item.url ? ` · ${item.url}` : ''}</p>
                {item.skills_used && item.skills_used.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.skills_used.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-dfp-blue-50 text-dfp-blue-600 text-[10px] rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => editItem(item)} className="w-7 h-7 rounded flex items-center justify-center text-dfp-stone-400 hover:text-dfp-blue-600 hover:bg-dfp-blue-50 transition-colors cursor-pointer"><i className="ri-edit-line text-sm"></i></button>
                <button onClick={() => item.id && deleteItem(item.id)} className="w-7 h-7 rounded flex items-center justify-center text-dfp-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><i className="ri-delete-bin-line text-sm"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      <div className="bg-white border border-dfp-stone-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-dfp-stone-900 mb-3">{editing ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-medium text-dfp-stone-600 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Project name" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-dfp-stone-600 mb-1">Project Type</label>
            <input type="text" value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })} className="w-full px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="e.g. Web App" />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-dfp-stone-600 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white resize-none" placeholder="Brief description of the project"></textarea>
        </div>
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-dfp-stone-600 mb-1">URL</label>
          <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="https://..." />
        </div>
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-dfp-stone-600 mb-1">Skills Used</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className="flex-1 px-3 py-2 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white" placeholder="Add skill" />
            <button onClick={addSkill} className="px-3 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-sm rounded-lg hover:bg-dfp-stone-200 cursor-pointer whitespace-nowrap">Add</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {form.skills_used.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-dfp-green-50 text-dfp-green-700 text-[11px] rounded-full">
                {s}
                <button onClick={() => setForm({ ...form, skills_used: form.skills_used.filter((x) => x !== s) })} className="hover:text-red-500 cursor-pointer"><i className="ri-close-line"></i></button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={saveItem} className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer whitespace-nowrap">
            {editing ? 'Update' : 'Add Item'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ title: '', description: '', project_type: '', skills_used: [], url: '', sort_order: 0 }); }} className="px-4 py-2 bg-dfp-stone-100 text-dfp-stone-600 text-sm rounded-lg hover:bg-dfp-stone-200 cursor-pointer">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}