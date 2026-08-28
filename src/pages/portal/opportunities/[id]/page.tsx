import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

const approvedSidebar = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Available Work', href: '/portal/opportunities', icon: 'ri-briefcase-line' },
  { label: 'My Applications', href: '/portal/applications', icon: 'ri-file-list-3-line' },
  { label: 'Active Assignments', href: '/portal/assignments', icon: 'ri-list-check-3' },
  { label: 'Messages', href: '/portal/coming-soon/messages', icon: 'ri-message-3-line', comingSoon: true },
  { label: 'Timesheets', href: '/portal/coming-soon/timesheets', icon: 'ri-time-line', comingSoon: true },
  { label: 'Invoices', href: '/portal/coming-soon/invoices', icon: 'ri-bill-line', comingSoon: true },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  project_name: string;
  client_label: string;
  location_type: string;
  location: string;
  engagement_type: string;
  budget_range: string;
  currency: string;
  estimated_duration: string;
  start_date: string;
  deadline: string;
  required_skills: string[];
  preferred_skills: string[];
  deliverables_summary: string;
  application_deadline: string;
  status: string;
  priority: string;
  published_at: string;
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form fields
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [rateType, setRateType] = useState('hourly');
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('work_opportunities')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) { setError('Opportunity not found'); return; }
        setOpportunity(data);

        // Check for existing application
        if (profile) {
          const { data: appData } = await supabase
            .from('opportunity_applications')
            .select('*')
            .eq('opportunity_id', id)
            .eq('freelancer_id', profile.id)
            .maybeSingle();
          if (!cancelled) setExistingApp(appData);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) { setLoading(false); setAppLoading(false); }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id, profile]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !opportunity) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const { error: insertError } = await supabase
        .from('opportunity_applications')
        .insert({
          opportunity_id: opportunity.id,
          freelancer_id: profile.id,
          cover_letter: coverLetter,
          proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
          rate_type: rateType,
          currency: opportunity.currency || 'GBP',
          availability_notes: availabilityNotes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setSubmitError('You have already applied to this opportunity.');
        } else {
          throw insertError;
        }
        return;
      }

      setSubmitSuccess(true);
      setShowApply(false);
      setExistingApp({ status: 'submitted' });
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-amber-100 text-amber-700',
      normal: 'bg-dfp-blue-100 text-dfp-blue-700',
      low: 'bg-dfp-stone-100 text-dfp-stone-500',
    };
    return map[priority] || map.normal;
  };

  const getAppStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      submitted: { label: 'Application Submitted', color: 'bg-dfp-blue-100 text-dfp-blue-700' },
      under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
      shortlisted: { label: 'Shortlisted', color: 'bg-dfp-green-100 text-dfp-green-700' },
      accepted: { label: 'Accepted', color: 'bg-dfp-green-100 text-dfp-green-700' },
      declined: { label: 'Not Selected', color: 'bg-red-100 text-red-700' },
      withdrawn: { label: 'Withdrawn', color: 'bg-dfp-stone-100 text-dfp-stone-500' },
    };
    return map[status] || { label: status, color: 'bg-dfp-stone-100 text-dfp-stone-500' };
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{error || 'Opportunity not found'}</p>
          <Link to="/portal/opportunities" className="text-sm font-medium text-dfp-green-700 hover:text-dfp-green-800">Back to opportunities</Link>
        </div>
      </PortalLayout>
    );
  }

  if (profile?.role === 'pending_freelancer') {
    return (
      <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dfp-blue-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-hourglass-line text-2xl text-dfp-blue-500"></i>
          </div>
          <h2 className="font-display text-lg font-semibold text-dfp-stone-900 mb-2">Application Under Review</h2>
          <p className="text-sm text-dfp-stone-500">Work opportunities become available once your freelancer application is approved.</p>
        </div>
      </PortalLayout>
    );
  }

  const appStatus = existingApp ? getAppStatusDisplay(existingApp.status) : null;

  return (
    <PortalLayout sidebarItems={approvedSidebar} role={profile?.role || ''}>
      <div className="max-w-4xl mx-auto">
        <Link to="/portal/opportunities" className="inline-flex items-center gap-1.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 mb-4 cursor-pointer">
          <i className="ri-arrow-left-line"></i> Back to opportunities
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="text-xs font-medium text-dfp-stone-500 bg-dfp-stone-50 px-2 py-0.5 rounded">{opportunity.category}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${getPriorityBadge(opportunity.priority)}`}>{opportunity.priority}</span>
          </div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900 mb-2">{opportunity.title}</h1>
          <p className="text-sm text-dfp-stone-600 mb-4">{opportunity.project_name} — {opportunity.client_label}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-dfp-stone-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Location</p>
              <p className="text-sm font-medium text-dfp-stone-700 capitalize">{opportunity.location_type.replace('_', ' ')}{opportunity.location ? ` — ${opportunity.location}` : ''}</p>
            </div>
            <div className="bg-dfp-stone-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Engagement</p>
              <p className="text-sm font-medium text-dfp-stone-700 capitalize">{opportunity.engagement_type.replace('_', ' / ')}</p>
            </div>
            <div className="bg-dfp-stone-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Budget</p>
              <p className="text-sm font-medium text-dfp-stone-700">{opportunity.budget_range}</p>
            </div>
            <div className="bg-dfp-stone-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-dfp-stone-400 mb-0.5">Duration</p>
              <p className="text-sm font-medium text-dfp-stone-700">{opportunity.estimated_duration}</p>
            </div>
          </div>

          {(opportunity.start_date || opportunity.deadline) && (
            <div className="flex items-center gap-4 mt-4 text-xs text-dfp-stone-500">
              {opportunity.start_date && <span>Start: {new Date(opportunity.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              {opportunity.deadline && <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-3">About this opportunity</h2>
          <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{opportunity.description}</p>
        </div>

        {/* Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h3 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {(opportunity.required_skills || []).map((skill: string) => (
                <span key={skill} className="text-xs font-medium px-2.5 py-1 rounded-full bg-dfp-green-50 text-dfp-green-700">{skill}</span>
              ))}
              {(opportunity.required_skills || []).length === 0 && (
                <span className="text-xs text-dfp-stone-400">No specific skills required</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
            <h3 className="font-display text-sm font-semibold text-dfp-stone-900 mb-3">Preferred Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {(opportunity.preferred_skills || []).map((skill: string) => (
                <span key={skill} className="text-xs font-medium px-2.5 py-1 rounded-full bg-dfp-blue-50 text-dfp-blue-700">{skill}</span>
              ))}
              {(opportunity.preferred_skills || []).length === 0 && (
                <span className="text-xs text-dfp-stone-400">No preferred skills listed</span>
              )}
            </div>
          </div>
        </div>

        {/* Deliverables */}
        {opportunity.deliverables_summary && (
          <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
            <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-3">Expected Deliverables</h2>
            <p className="text-sm text-dfp-stone-600 leading-relaxed whitespace-pre-line">{opportunity.deliverables_summary}</p>
          </div>
        )}

        {/* Application status / Apply section */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          {appStatus ? (
            <div>
              <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-3">Your Application</h2>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${appStatus.color}`}>{appStatus.label}</div>
                {existingApp?.submitted_at && (
                  <span className="text-xs text-dfp-stone-400">Submitted {new Date(existingApp.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
              {existingApp?.review_notes && (
                <div className="mt-4 p-3 bg-dfp-stone-50 rounded-lg">
                  <p className="text-xs text-dfp-stone-500 mb-1">Reviewer notes:</p>
                  <p className="text-sm text-dfp-stone-700">{existingApp.review_notes}</p>
                </div>
              )}
            </div>
          ) : submitSuccess ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-dfp-green-50 flex items-center justify-center mx-auto mb-3">
                <i className="ri-check-double-line text-2xl text-dfp-green-600"></i>
              </div>
              <h3 className="font-display text-base font-semibold text-dfp-stone-900 mb-1">Application Submitted</h3>
              <p className="text-sm text-dfp-stone-500">We will review your application and get back to you.</p>
            </div>
          ) : (
            <div>
              {!showApply ? (
                <div className="text-center py-4">
                  <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-2">Interested in this opportunity?</h2>
                  <p className="text-sm text-dfp-stone-500 mb-4">Submit your application with your proposed rate and availability.</p>
                  <button
                    onClick={() => setShowApply(true)}
                    className="px-6 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  <h2 className="font-display text-base font-semibold text-dfp-stone-900 mb-4">Submit Application</h2>
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">{submitError}</div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={5}
                        required
                        placeholder="Tell us why you are a great fit for this opportunity. Include relevant experience, projects, and why you are interested..."
                        className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400 resize-none"
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Proposed Rate ({opportunity.currency || 'GBP'})</label>
                        <input
                          type="number"
                          value={proposedRate}
                          onChange={(e) => setProposedRate(e.target.value)}
                          placeholder={opportunity.engagement_type === 'hourly' ? 'e.g. 50' : 'e.g. 400'}
                          className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Rate Type</label>
                        <select
                          value={rateType}
                          onChange={(e) => setRateType(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 cursor-pointer"
                        >
                          <option value="hourly">Per Hour</option>
                          <option value="daily">Per Day</option>
                          <option value="fixed">Fixed Price</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dfp-stone-600 mb-1.5">Availability Notes</label>
                      <input
                        type="text"
                        value={availabilityNotes}
                        onChange={(e) => setAvailabilityNotes(e.target.value)}
                        placeholder="e.g. Available to start immediately, 30 hours per week"
                        className="w-full px-3 py-2.5 text-sm bg-white border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApply(false)}
                      className="px-4 py-2.5 text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}