import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import supabase from '@/lib/supabase';
import PortalLayout from '@/components/feature/PortalLayout';

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

interface ProfileData {
  preferred_name?: string;
  telephone?: string;
  country?: string;
  city_region?: string;
  timezone?: string;
  languages?: string[];
  bio?: string;
  primary_category?: string;
  experience_years?: number;
  experience_level?: string;
  tools_platforms?: string[];
  certifications?: string[];
  profile_photo_url?: string;
}

export default function ProfilePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const load = async () => {
      const { data: p, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (!cancelled && !error && p) {
        setData({
          preferred_name: p.preferred_name,
          telephone: p.telephone,
          country: p.country,
          city_region: p.city_region,
          timezone: p.timezone,
          languages: p.languages,
          bio: p.bio,
          primary_category: p.primary_category,
          experience_years: p.experience_years,
          experience_level: p.experience_level,
          tools_platforms: p.tools_platforms,
          certifications: p.certifications,
          profile_photo_url: p.profile_photo_url,
        });
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const loadPhotoPreview = useCallback(async (photoUrl: string) => {
    try {
      const { data: signedData } = await supabase.storage
        .from('freelancer-avatars')
        .createSignedUrl(photoUrl, 86400);
      if (signedData?.signedUrl) {
        setPhotoPreview(signedData.signedUrl);
      }
    } catch {
      // photo might not exist yet - that's ok
    }
  }, []);

  useEffect(() => {
    if (data.profile_photo_url) {
      loadPhotoPreview(data.profile_photo_url);
    }
  }, [data.profile_photo_url, loadPhotoPreview]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be under 5MB');
      return;
    }

    setPhotoUploading(true);
    setPhotoError(null);

    try {
      // Delete old avatar if exists
      if (data.profile_photo_url) {
        await supabase.storage.from('freelancer-avatars').remove([data.profile_photo_url]);
      }

      const filePath = `${profile.id}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage.from('freelancer-avatars').upload(filePath, file, {
        upsert: true,
      });
      if (uploadErr) throw uploadErr;

      await supabase.from('freelancer_profiles').upsert(
        { user_id: profile.id, profile_photo_url: filePath },
        { onConflict: 'user_id' }
      );

      setData((prev) => ({ ...prev, profile_photo_url: filePath }));
      await loadPhotoPreview(filePath);
    } catch (err) {
      setPhotoError('Failed to upload photo. Please try again.');
      console.error('Photo upload failed:', err);
    } finally {
      setPhotoUploading(false);
      const input = document.getElementById('photo-upload-input') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!data.profile_photo_url) return;
    try {
      await supabase.storage.from('freelancer-avatars').remove([data.profile_photo_url]);
      await supabase.from('freelancer_profiles').upsert(
        { user_id: profile!.id, profile_photo_url: null },
        { onConflict: 'user_id' }
      );
      setData((prev) => ({ ...prev, profile_photo_url: undefined }));
      setPhotoPreview(null);
    } catch {
      setPhotoError('Failed to remove photo.');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { preferred_name, telephone, country, city_region, timezone, bio } = data;
    await supabase.from('freelancer_profiles').upsert(
      { user_id: profile.id, preferred_name, telephone, country, city_region, timezone, bio },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  return (
    <PortalLayout sidebarItems={sidebarItems} role={profile?.role || ''}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-dfp-stone-900">Profile</h1>
            <p className="text-sm text-dfp-stone-500 mt-1">Manage your personal information and profile photo.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-dfp-green-600 text-white text-sm font-semibold rounded-lg hover:bg-dfp-green-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Profile Photo Section */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6 mb-5">
          <h2 className="text-sm font-semibold text-dfp-stone-800 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-dfp-stone-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-dfp-green-100 flex items-center justify-center border-2 border-dfp-stone-200">
                  <span className="text-xl font-semibold text-dfp-green-700">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                </div>
              )}
              {photoUploading && (
                <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-dfp-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm text-dfp-stone-700 mb-1">Upload a professional headshot</p>
              <p className="text-xs text-dfp-stone-400 mb-3">JPG, PNG or WebP. Max 5MB. Square images work best.</p>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="px-4 py-2 bg-dfp-stone-800 text-white text-xs font-medium rounded-lg hover:bg-dfp-stone-900 transition-colors cursor-pointer whitespace-nowrap">
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    id="photo-upload-input"
                    type="file"
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={photoUploading}
                  />
                </label>
                {photoPreview && (
                  <button
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Remove
                  </button>
                )}
              </div>
              {photoError && (
                <p className="text-xs text-red-500 mt-2">{photoError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-dfp-stone-200 p-5 md:p-6">
          <h2 className="text-sm font-semibold text-dfp-stone-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={profile?.first_name || ''}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg bg-dfp-stone-50 text-dfp-stone-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-dfp-stone-400 mt-0.5">Set during registration</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={profile?.last_name || ''}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg bg-dfp-stone-50 text-dfp-stone-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-dfp-stone-400 mt-0.5">Set during registration</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Preferred Name</label>
              <input
                type="text"
                value={data.preferred_name || ''}
                onChange={(e) => setData({ ...data, preferred_name: e.target.value })}
                placeholder="How should we address you?"
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white placeholder:text-dfp-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Telephone</label>
              <input
                type="tel"
                value={data.telephone || ''}
                onChange={(e) => setData({ ...data, telephone: e.target.value })}
                placeholder="+44 7..."
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white placeholder:text-dfp-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Country</label>
              <input
                type="text"
                value={data.country || ''}
                onChange={(e) => setData({ ...data, country: e.target.value })}
                placeholder="United Kingdom"
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white placeholder:text-dfp-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">City / Region</label>
              <input
                type="text"
                value={data.city_region || ''}
                onChange={(e) => setData({ ...data, city_region: e.target.value })}
                placeholder="London"
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white placeholder:text-dfp-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Timezone</label>
              <input
                type="text"
                value={data.timezone || ''}
                onChange={(e) => setData({ ...data, timezone: e.target.value })}
                placeholder="Europe/London"
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white placeholder:text-dfp-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">Account Status</label>
              <input
                type="text"
                value={profile?.account_status || ''}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg bg-dfp-stone-50 text-dfp-stone-500 cursor-not-allowed capitalize"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-medium text-dfp-stone-700 mb-1.5">
              Professional Summary
              <span className="text-dfp-stone-300 font-normal ml-1">({(data.bio || '').length}/500)</span>
            </label>
            <textarea
              value={data.bio || ''}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              rows={4}
              maxLength={500}
              placeholder="Briefly describe your professional background, expertise, and what kind of work you are looking for..."
              className="w-full px-3 py-2.5 text-sm border border-dfp-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dfp-green-500/20 focus:border-dfp-green-500 bg-white resize-none placeholder:text-dfp-stone-300"
            ></textarea>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-4 flex items-center justify-between">
          <Link to="/portal/application" className="text-sm text-dfp-green-700 hover:text-dfp-green-800 font-medium cursor-pointer">
            <i className="ri-arrow-left-line mr-1"></i> Go to full application wizard
          </Link>
          <Link to="/portal/security" className="text-sm text-dfp-stone-500 hover:text-dfp-stone-700 cursor-pointer">
            <i className="ri-shield-line mr-1"></i> Security Settings
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}