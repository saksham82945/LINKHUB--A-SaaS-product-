'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        setProfile(res.data);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch('/profile/me', {
        displayName: profile.displayName,
        bio: profile.bio,
        theme: profile.theme,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast.success('Avatar uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-gray-800 flex items-center px-8 bg-gray-950">
        <h1 className="text-lg font-semibold text-white">Profile Settings</h1>
      </div>

      <div className="p-8 max-w-2xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Avatar Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-500">{profile?.displayName?.[0] || '?'}</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block border border-gray-700">
                    {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Upload your photo via AWS S3 (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={profile?.displayName || ''}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={profile?.bio || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Tell your audience about yourself..."
              />
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <select
                name="theme"
                value={profile?.theme || 'LIGHT'}
                onChange={handleChange}
                className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="LIGHT">Light Theme</option>
                <option value="DARK">Dark Theme</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
