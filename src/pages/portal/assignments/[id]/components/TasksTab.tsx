import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';

interface Task {
  id: string;
  assignment_id: string;
  created_by: string;
  assigned_to: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  parent_task_id: string | null;
  sort_order: number;
  created_at: string;
}

interface TasksTabProps {
  assignmentId: string;
  isStaff: boolean;
}

const priorityColors: Record<string, string> = {
  low: 'bg-dfp-stone-100 text-dfp-stone-600',
  medium: 'bg-dfp-blue-100 text-dfp-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  pending: 'bg-dfp-stone-100 text-dfp-stone-600',
  in_progress: 'bg-dfp-blue-100 text-dfp-blue-700',
  blocked: 'bg-orange-100 text-orange-700',
  done: 'bg-dfp-green-100 text-dfp-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function TasksTab({ assignmentId, isStaff }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [filter, setFilter] = useState<string>('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error: fErr } = await supabase
        .from('assignment_tasks')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (fErr) throw fErr;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [assignmentId]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const { error: insErr } = await supabase.from('assignment_tasks').insert({
        assignment_id: assignmentId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        due_date: form.due_date || null,
        status: 'pending',
      });
      if (insErr) throw insErr;
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'done') updates.completed_at = new Date().toISOString();
      const { error: updErr } = await supabase.from('assignment_tasks').update(updates).eq('id', taskId);
      if (updErr) throw updErr;
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-sm font-semibold text-dfp-stone-900">Tasks</h2>
            {totalCount > 0 && (
              <span className="text-xs text-dfp-stone-400">{doneCount}/{totalCount} done</span>
            )}
          </div>
          {totalCount > 0 && (
            <div className="w-full sm:w-48 h-1.5 bg-dfp-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-dfp-green-500 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}></div>
            </div>
          )}
        </div>
        {isStaff && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className={`${showForm ? 'ri-close-line' : 'ri-add-line'} mr-1`}></i>
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">{error}</div>}

      {/* Create form */}
      {showForm && (
        <div className="bg-dfp-stone-50 rounded-xl border border-dfp-stone-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Design wireframes for homepage"
                className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-dfp-stone-500 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of the task..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-dfp-stone-200 bg-white focus:outline-none focus:border-dfp-green-400 resize-none"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="px-4 py-2 bg-dfp-green-600 text-white text-xs font-medium rounded-lg hover:bg-dfp-green-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      )}

      {/* Filters */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all','pending','in_progress','blocked','done'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize whitespace-nowrap cursor-pointer transition-colors ${
                filter === f ? 'bg-dfp-stone-800 text-white' : 'bg-white text-dfp-stone-500 border border-dfp-stone-200 hover:bg-dfp-stone-50'
              }`}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dfp-stone-200">
          <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
            <i className="ri-task-line text-xl text-dfp-stone-300"></i>
          </div>
          <p className="text-sm text-dfp-stone-400 mb-1">{tasks.length === 0 ? 'No tasks yet' : 'No tasks match this filter'}</p>
          <p className="text-xs text-dfp-stone-300">{isStaff ? 'Click "Add Task" to create the first one.' : 'Tasks will appear here once created by the project manager.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-dfp-stone-200 p-4 hover:border-dfp-stone-300 transition-colors">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'done' ? 'pending' : 'done')}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                    task.status === 'done' ? 'bg-dfp-green-500 border-dfp-green-500' : 'border-dfp-stone-300 hover:border-dfp-green-400'
                  }`}
                >
                  {task.status === 'done' && <i className="ri-check-line text-[10px] text-white"></i>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-sm font-medium ${task.status === 'done' ? 'text-dfp-stone-400 line-through' : 'text-dfp-stone-800'}`}>
                      {task.title}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${priorityColors[task.priority] || ''}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[task.status] || ''}`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-dfp-stone-400 line-clamp-2">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-[11px] text-dfp-stone-400 mt-1.5">
                      <i className="ri-calendar-line mr-1"></i>
                      Due {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {isStaff && (
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-dfp-stone-200 bg-white text-dfp-stone-600 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}