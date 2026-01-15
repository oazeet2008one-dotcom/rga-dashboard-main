import React, { useMemo, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockUserProfile } from '../data/mockDashboard';

interface ProfileState {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const initialProfile: ProfileState = useMemo(
    () => ({
      firstName: mockUserProfile.firstName || '',
      lastName: mockUserProfile.lastName || '',
      email: mockUserProfile.email,
      avatarUrl: mockUserProfile.avatarUrl,
    }),
    []
  );

  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFieldChange = (field: keyof ProfileState, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatarUrl: previewUrl }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setSaving(true);
    setSavedMessage('');
    setTimeout(() => {
      setSaving(false);
      setHasUnsavedChanges(false);
      setSavedMessage('Profile saved successfully');
      setTimeout(() => setSavedMessage(''), 2500);
    }, 1200);
  };

  const handleReset = () => {
    setProfile(initialProfile);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-[#fdf6f0] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-3xl shadow p-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-500">Profile</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-sm text-gray-500">{mockUserProfile.role?.toUpperCase()} • {mockUserProfile.location}</p>
            {savedMessage && <p className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {savedMessage}</p>}
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="relative w-32 h-32 md:self-end">
              <img
                src={profile.avatarUrl || 'https://placehold.co/300x300?text=Avatar'}
                alt={profile.firstName}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              <label className="absolute bottom-2 right-2 inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white shadow cursor-pointer">
                <Camera className="h-5 w-5 text-gray-600" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <button
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </button>
              <button
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold shadow-md disabled:opacity-60"
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-3xl shadow p-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.0em] text-gray-500">Basic Information</p>
            <h2 className="text-xl font-semibold text-gray-900">Update account details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm text-gray-700">
              First name
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2"
                value={profile.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700">
              Last name
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2"
                value={profile.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm text-gray-700 md:col-span-2">
              Email
              <input
                type="email"
                className="w-full rounded-2xl border border-gray-200 px-4 py-2"
                value={profile.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-xs uppercase tracking-[0.0em] text-gray-500">Registration details</p>
              <h2 className="text-xl font-semibold text-gray-900">Account timeline</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-[0.0em] text-gray-400">Registered on</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{mockUserProfile.registeredAt}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-[0.0em] text-gray-400">Last login</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{mockUserProfile.lastLogin}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-[0.0em] text-gray-400">Tenant ID</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{mockUserProfile.tenantId}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-xs uppercase tracking-[0.0em] text-gray-400">User ID</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{mockUserProfile.id}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
