import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';
import Step1Personal from './components/Step1Personal';
import Step2Business from './components/Step2Business';
import Step3Skills from './components/Step3Skills';
import Step4Availability from './components/Step4Availability';
import Step5Portfolio from './components/Step5Portfolio';
import Step6Documents from './components/Step6Documents';
import Step7Agreements from './components/Step7Agreements';
import Step8Review from './components/Step8Review';

const STEPS = [
  { id: 1, label: 'Personal', icon: 'ri-user-line' },
  { id: 2, label: 'Business', icon: 'ri-building-line' },
  { id: 3, label: 'Skills', icon: 'ri-award-line' },
  { id: 4, label: 'Availability', icon: 'ri-calendar-line' },
  { id: 5, label: 'Portfolio', icon: 'ri-briefcase-line' },
  { id: 6, label: 'Documents', icon: 'ri-folder-line' },
  { id: 7, label: 'Agreements', icon: 'ri-file-text-line' },
  { id: 8, label: 'Review', icon: 'ri-search-eye-line' },
];

const sidebarItems = [
  { label: 'Dashboard', href: '/portal', icon: 'ri-dashboard-line' },
  { label: 'Application', href: '/portal/application', icon: 'ri-file-list-3-line' },
  { label: 'Profile', href: '/portal/profile', icon: 'ri-user-line' },
  { label: 'Skills', href: '/portal/skills', icon: 'ri-award-line' },
  { label: 'Portfolio', href: '/portal/portfolio', icon: 'ri-briefcase-line' },
  { label: 'Documents', href: '/portal/documents', icon: 'ri-folder-line' },
  { label: 'Agreements', href: '/portal/agreements', icon: 'ri-file-text-line' },
  { label: 'Security', href: '/portal/security', icon: 'ri-shield-line' },
  { label: 'Support', href: '/portal/support', icon: 'ri-question-line' },
];

export interface ApplicationFormData {
  // Step 1: Personal
  preferred_name?: string;
  telephone?: string;
  country?: string;
  city_region?: string;
  timezone?: string;
  languages?: string[];
  bio?: string;
  // Step 2: Business
  business_type?: string;
  trading_name?: string;
  company_name?: string;
  company_number?: string;
  vat_registered?: boolean;
  vat_number?: string;
  business_address?: Record<string, string>;
  website?: string;
  professional_profile_url?: string;
  // Step 3: Skills
  primary_category?: string;
  additional_categories?: string[];
  skills?: string[];
  experience_years?: number;
  experience_level?: string;
  tools_platforms?: string[];
  certifications?: string[];
  preferred_project_types?: string[];
  // Step 4: Availability
  availability_status?: string;
  hours_per_week?: number;
  preferred_days?: string[];
  earliest_start_date?: string;
  remote_preference?: string;
  travel_available?: boolean;
  hourly_rate?: number;
  day_rate?: number;
  fixed_price_accepted?: boolean;
  currency?: string;
}

export default function ApplicationWizard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing data
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        const [profileRes, bizRes, skillsRes, availRes, ratesRes] = await Promise.all([
          supabase.from('freelancer_profiles').select('*').eq('user_id', profile.id).maybeSingle(),
          supabase.from('freelancer_business_details').select('*').eq('user_id', profile.id).maybeSingle(),
          supabase.from('freelancer_skills').select('*').eq('user_id', profile.id).maybeSingle(),
          supabase.from('freelancer_availability').select('*').eq('user_id', profile.id).maybeSingle(),
          supabase.from('freelancer_rates').select('*').eq('user_id', profile.id).maybeSingle(),
        ]);

        if (cancelled) return;

        const p = profileRes.data;
        const b = bizRes.data;
        const s = skillsRes.data;
        const a = availRes.data;
        const r = ratesRes.data;

        setFormData({
          preferred_name: p?.preferred_name || profile.first_name,
          telephone: p?.telephone || '',
          country: p?.country || '',
          city_region: p?.city_region || '',
          timezone: p?.timezone || '',
          languages: p?.languages || [],
          bio: p?.bio || '',
          business_type: b?.business_type || '',
          trading_name: b?.trading_name || '',
          company_name: b?.company_name || '',
          company_number: b?.company_number || '',
          vat_registered: b?.vat_registered || false,
          vat_number: b?.vat_number || '',
          business_address: b?.business_address || {},
          website: b?.website || '',
          professional_profile_url: b?.professional_profile_url || '',
          primary_category: p?.primary_category || s?.category || '',
          additional_categories: p?.additional_categories || [],
          skills: s?.skills || [],
          experience_years: p?.experience_years || 0,
          experience_level: p?.experience_level || '',
          tools_platforms: p?.tools_platforms || [],
          certifications: p?.certifications || [],
          preferred_project_types: p?.preferred_project_types || [],
          availability_status: a?.availability_status || '',
          hours_per_week: a?.hours_per_week || 0,
          preferred_days: a?.preferred_days || [],
          earliest_start_date: a?.earliest_start_date || '',
          remote_preference: a?.remote_preference || '',
          travel_available: a?.travel_available || false,
          hourly_rate: r?.hourly_rate ? Number(r.hourly_rate) : 0,
          day_rate: r?.day_rate ? Number(r.day_rate) : 0,
          fixed_price_accepted: r?.fixed_price_accepted || false,
          currency: r?.currency || 'GBP',
        });
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [profile]);

  // URL step param
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const s = parseInt(stepParam);
      if (s >= 1 && s <= 8) setCurrentStep(s);
    }
  }, [searchParams]);

  const updateFormData = useCallback((updates: Partial<ApplicationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Autosave with debounce
  const autosave = useCallback(async (data: ApplicationFormData) => {
    if (!profile) return;
    setSaveStatus('saving');
    try {
      // Upsert freelancer_profiles (steps 1, 3)
      const profileUpsert: Record<string, any> = {};
      if (data.preferred_name !== undefined) profileUpsert.preferred_name = data.preferred_name;
      if (data.telephone !== undefined) profileUpsert.telephone = data.telephone;
      if (data.country !== undefined) profileUpsert.country = data.country;
      if (data.city_region !== undefined) profileUpsert.city_region = data.city_region;
      if (data.timezone !== undefined) profileUpsert.timezone = data.timezone;
      if (data.languages !== undefined) profileUpsert.languages = data.languages;
      if (data.bio !== undefined) profileUpsert.bio = data.bio;
      if (data.primary_category !== undefined) profileUpsert.primary_category = data.primary_category;
      if (data.additional_categories !== undefined) profileUpsert.additional_categories = data.additional_categories;
      if (data.experience_years !== undefined) profileUpsert.experience_years = data.experience_years;
      if (data.experience_level !== undefined) profileUpsert.experience_level = data.experience_level;
      if (data.tools_platforms !== undefined) profileUpsert.tools_platforms = data.tools_platforms;
      if (data.certifications !== undefined) profileUpsert.certifications = data.certifications;
      if (data.preferred_project_types !== undefined) profileUpsert.preferred_project_types = data.preferred_project_types;

      const promises: Promise<any>[] = [];

      if (Object.keys(profileUpsert).length > 0) {
        promises.push(
          supabase.from('freelancer_profiles').upsert({ user_id: profile.id, ...profileUpsert }, { onConflict: 'user_id' })
        );
      }

      // Business details (step 2)
      if (data.business_type !== undefined || data.trading_name !== undefined) {
        promises.push(
          supabase.from('freelancer_business_details').upsert({
            user_id: profile.id,
            business_type: data.business_type,
            trading_name: data.trading_name,
            company_name: data.company_name,
            company_number: data.company_number,
            vat_registered: data.vat_registered,
            vat_number: data.vat_number,
            business_address: data.business_address,
            website: data.website,
            professional_profile_url: data.professional_profile_url,
          }, { onConflict: 'user_id' })
        );
      }

      // Skills (step 3)
      if (data.skills !== undefined) {
        promises.push(
          supabase.from('freelancer_skills').upsert({
            user_id: profile.id,
            category: data.primary_category || '',
            skills: data.skills,
          }, { onConflict: 'user_id' })
        );
      }

      // Availability (step 4)
      if (data.availability_status !== undefined || data.hours_per_week !== undefined) {
        promises.push(
          supabase.from('freelancer_availability').upsert({
            user_id: profile.id,
            availability_status: data.availability_status,
            hours_per_week: data.hours_per_week,
            preferred_days: data.preferred_days,
            earliest_start_date: data.earliest_start_date,
            remote_preference: data.remote_preference,
            travel_available: data.travel_available,
          }, { onConflict: 'user_id' })
        );
      }

      // Rates (step 4)
      if (data.hourly_rate !== undefined || data.day_rate !== undefined) {
        promises.push(
          supabase.from('freelancer_rates').upsert({
            user_id: profile.id,
            hourly_rate: data.hourly_rate,
            day_rate: data.day_rate,
            fixed_price_accepted: data.fixed_price_accepted,
            currency: data.currency,
          }, { onConflict: 'user_id' })
        );
      }

      await Promise.all(promises);

      // Update application profile_completion
      const completion = calculateCompletion(data);
      await supabase.from('freelancer_applications').upsert({
        user_id: profile.id,
        profile_completion: completion,
        status: 'draft',
      }, { onConflict: 'user_id' });

      setSaveStatus('saved');
      setLastSaved(new Date().toLocaleTimeString());
    } catch {
      setSaveStatus('error');
    }
  }, [profile]);

  const calculateCompletion = (data: ApplicationFormData): number => {
    let score = 0;
    if (data.preferred_name && data.country && data.timezone) score += 15;
    if (data.business_type) score += 15;
    if (data.primary_category && data.skills && data.skills.length > 0) score += 15;
    if (data.availability_status && data.hourly_rate && data.hourly_rate > 0) score += 15;
    // Portfolio score handled separately when items exist
    if (data.bio && data.experience_years && data.experience_years > 0) score += 10;
    return Math.min(score, 85); // max 85% without portfolio/docs/agreements
  };

  // Debounced autosave
  useEffect(() => {
    if (loading) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      autosave(formData);
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [formData, autosave, loading]);

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from('freelancer_applications').upsert({
        user_id: profile.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        profile_completion: calculateCompletion(formData),
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Create audit event
      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: 'application_submitted',
        entity_type: 'freelancer_application',
        new_value: { status: 'submitted' },
      });

      setSubmitSuccess(true);
      setTimeout(() => navigate('/portal'), 2000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PortalLayout>
    );
  }

  if (loadError) {
    return (
      <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-dfp-stone-600 mb-4">{loadError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-dfp-green-600 text-white text-sm font-medium rounded-lg hover:bg-dfp-green-700 transition-colors cursor-pointer">Retry</button>
        </div>
      </PortalLayout>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Personal data={formData} onChange={updateFormData} />;
      case 2: return <Step2Business data={formData} onChange={updateFormData} />;
      case 3: return <Step3Skills data={formData} onChange={updateFormData} />;
      case 4: return <Step4Availability data={formData} onChange={updateFormData} />;
      case 5: return <Step5Portfolio data={formData} onChange={updateFormData} />;
      case 6: return <Step6Documents data={formData} onChange={updateFormData} />;
      case 7: return <Step7Agreements data={formData} onChange={updateFormData} />;
      case 8: return <Step8Review data={formData} />;
      default: return null;
    }
  };

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-xl md:text-2xl font-bold text-dfp-stone-900">Freelancer Application</h1>
          <p className="text-sm text-dfp-stone-500 mt-1">Complete all steps to submit your application for review.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  currentStep === step.id
                    ? 'bg-dfp-green-600 text-white'
                    : currentStep > step.id
                    ? 'bg-dfp-green-50 text-dfp-green-700'
                    : 'bg-dfp-stone-100 text-dfp-stone-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === step.id ? 'bg-white/20' : currentStep > step.id ? 'bg-dfp-green-100' : 'bg-dfp-stone-200'
                }`}>
                  {currentStep > step.id ? <i className="ri-check-line text-xs"></i> : step.id}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`w-6 h-px ${currentStep > step.id ? 'bg-dfp-green-300' : 'bg-dfp-stone-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Save status */}
        <div className="flex items-center gap-2 mb-6">
          {saveStatus === 'saving' && (
            <span className="text-xs text-dfp-stone-400 flex items-center gap-1">
              <div className="w-3 h-3 border border-dfp-stone-300 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-dfp-green-600 flex items-center gap-1">
              <i className="ri-check-line"></i> Saved{lastSaved ? ` at ${lastSaved}` : ''}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <i className="ri-error-warning-line"></i> Save failed
            </span>
          )}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2.5 text-sm font-medium text-dfp-stone-600 hover:text-dfp-stone-900 rounded-lg hover:bg-dfp-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-1.5"></i> Previous
          </button>

          {currentStep < 8 ? (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Next <i className="ri-arrow-right-line ml-1.5"></i>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || submitSuccess}
              className="px-6 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : submitSuccess ? (
                <span className="flex items-center gap-2">
                  <i className="ri-check-double-line"></i> Submitted!
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="mt-4 p-3 bg-dfp-green-50 border border-dfp-green-100 rounded-lg text-sm text-dfp-green-700">
            Application submitted successfully! Redirecting to dashboard...
          </div>
        )}
      </div>
    </PortalLayout>
  );
}