import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';

interface ActivityEvent {
  id: string;
  assignment_id: string;
  actor_id: string | null;
  activity_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: any;
  created_at: string;
}

interface ActivityTabProps {
  assignmentId: string;
}

const activityIcons: Record<string, string> = {
  task_created: 'ri-add-circle-line',
  task_updated: 'ri-edit-circle-line',
  task_completed: 'ri-check-double-line',
  task_status_change: 'ri-arrow-left-right-line',
  milestone_created: 'ri-flag-line',
  milestone_completed: 'ri-flag-fill',
  milestone_approved: 'ri-check-double-line',
  submission_created: 'ri-upload-cloud-2-line',
  submission_reviewed: 'ri-search-eye-line',
  submission_approved: 'ri-check-line',
  submission_changes_requested: 'ri-edit-line',
  submission_rejected: 'ri-close-circle-line',
  message_sent: 'ri-chat-3-line',
  status_change: 'ri-arrow-left-right-line',
  assignment_created: 'ri-play-circle-line',
  assignment_updated: 'ri-edit-circle-line',
  change_requested: 'ri-git-pull-request-line',
  other: 'ri-information-line',
};

const activityColors: Record<string, string> = {
  task_created: 'bg-dfp-blue-100 text-dfp-blue-600',
  task_updated: 'bg-dfp-blue-100 text-dfp-blue-600',
  task_completed: 'bg-dfp-green-100 text-dfp-green-600',
  task_status_change: 'bg-amber-100 text-amber-600',
  milestone_created: 'bg-dfp-blue-100 text-dfp-blue-600',
  milestone_completed: 'bg-amber-100 text-amber-600',
  milestone_approved: 'bg-dfp-green-100 text-dfp-green-600',
  submission_created: 'bg-dfp-blue-100 text-dfp-blue-600',
  submission_reviewed: 'bg-amber-100 text-amber-600',
  submission_approved: 'bg-dfp-green-100 text-dfp-green-600',
  submission_changes_requested: 'bg-red-100 text-red-600',
  submission_rejected: 'bg-red-100 text-red-600',
  message_sent: 'bg-dfp-stone-100 text-dfp-stone-600',
  status_change: 'bg-amber-100 text-amber-600',
  assignment_created: 'bg-dfp-green-100 text-dfp-green-600',
  assignment_updated: 'bg-dfp-blue-100 text-dfp-blue-600',
  change_requested: 'bg-orange-100 text-orange-600',
  other: 'bg-dfp-stone-100 text-dfp-stone-500',
};

export default function ActivityTab({ assignmentId }: ActivityTabProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const { data, error: fErr } = await supabase
          .from('assignment_activity_log')
          .select('*')
          .eq('assignment_id', assignmentId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (cancelled) return;
        if (fErr) throw fErr;
        setEvents(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchActivity();
    return () => { cancelled = true; };
  }, [assignmentId]);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dfp-stone-200">
        <div className="w-12 h-12 rounded-xl bg-dfp-stone-50 flex items-center justify-center mx-auto mb-3">
          <i className="ri-history-line text-xl text-dfp-stone-300"></i>
        </div>
        <p className="text-sm text-dfp-stone-400 mb-1">No activity yet</p>
        <p className="text-xs text-dfp-stone-300">Activity will be recorded as tasks, milestones, submissions, and messages are created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <h2 className="font-display text-sm font-semibold text-dfp-stone-900 mb-4">Activity Timeline</h2>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-dfp-stone-100"></div>

        <div className="space-y-1">
          {events.map(event => {
            const icon = activityIcons[event.activity_type] || activityIcons.other;
            const color = activityColors[event.activity_type] || activityColors.other;
            return (
              <div key={event.id} className="flex items-start gap-3 pl-0 py-1.5">
                <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${color}`}>
                  <i className={`${icon} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-dfp-stone-700">{event.description}</p>
                  <p className="text-[11px] text-dfp-stone-400 mt-0.5">{formatDate(event.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}