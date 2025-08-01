'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient, AuthError, PostgrestError, User, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define types
interface UserData {
  id: string;
  email: string;
  name: string;
  is_onboarded: boolean;
  layout_preference?: string;
  language_preference?: string;
  allow_analytics?: boolean;
  pin?: string; // Added for PIN security
}

interface DatabaseResponse<T> {
  data: T | null;
  error: AuthError | PostgrestError | null;
}

export default function ProfileSetup() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [layoutPreference, setLayoutPreference] = useState<string>('cards');
  const [languagePreference, setLanguagePreference] = useState<string>('en');
  const [allowAnalytics, setAllowAnalytics] = useState<boolean>(true);
  const [pin, setPin] = useState<string>(''); // Added for PIN
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to load session. Please try again.');
          setLoading(false);
          return;
        }

        if (!session || !session.user) {
          console.log('No session found, redirecting to login...');
          setError('No user session found. Please log in.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          setLoading(false);
          return;
        }

        console.log('Session found, user ID:', session.user.id);
        setUserId(session.user.id);

        // Extract default name from email if available
        const userEmail = session.user.email;
        let extractedName = '';
        if (userEmail) {
          extractedName = userEmail
            .split('@')[0]
            .split('.')
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
          setName(extractedName);
          setEmail(userEmail);
        }

        // Fetch existing user data
        console.log('Fetching user data from database...');
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('name, email, is_onboarded, layout_preference, language_preference, allow_analytics, pin')
          .eq('id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error fetching user data:', userError);
          setError('Failed to load user data. Please try again.');
        } else if (user) {
          console.log('User data found:', user);
          setName(user.name || extractedName || '');
          setEmail(user.email || userEmail || '');
          setIsOnboarded(user.is_onboarded || false);
          setLayoutPreference(user.layout_preference || 'cards');
          setLanguagePreference(user.language_preference || 'en');
          setAllowAnalytics(user.allow_analytics || true);
          setPin(user.pin || ''); // Load existing PIN if any
          // REMOVED THE REDIRECT - Allow editing even if already onboarded
        } else {
          console.log('No user data found in database');
        }

        setLoading(false);
      } catch (err: unknown) {
        console.error('Unexpected error fetching user data:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleExportData = async () => {
    // Simple export logic (placeholder - to be expanded)
    const { data, error } = await supabase
      .from('users')
      .select('name, email, is_onboarded, layout_preference, language_preference, allow_analytics')
      .eq('id', userId);
    if (error) {
      console.error('Export error:', error);
      setError('Failed to export data.');
    } else if (data) {
      const exportData = JSON.stringify(data, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mental_health_tracker_data.json';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      setSaving(true);

      if (!userId) {
        setError('No user session found. Please log in.');
        setSaving(false);
        return;
      }

      if (!name.trim()) {
        setError('Name is required.');
        setSaving(false);
        return;
      }

      console.log('Saving profile data...');
      const updateData: Partial<UserData> = {
        name: name.trim(),
        email,
        is_onboarded: true,
        layout_preference: layoutPreference,
        language_preference: languagePreference,
        allow_analytics: allowAnalytics,
        pin: pin || undefined, // Save PIN if provided
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(`Failed to save profile: ${updateError.message}`);
        setSaving(false);
        return;
      }

      console.log('Profile saved successfully');
      setSuccess('Profile saved successfully!');
      setSaving(false);
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: unknown) {
      console.error('Unexpected error saving profile:', err);
      setError('An unexpected error occurred while saving your profile. Please try again.');
      setSaving(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg mb-4 mx-auto">
            <Heart className="h-6 w-6 text-white animate-pulse" aria-hidden="true" />
          </div>
          <p className="text-gray-800 text-lg">Loading profile setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          onClick={handleBackToHome}
          variant="outline"
          className="mb-6 border-gray-300 text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isOnboarded ? 'Edit Your Profile' : 'Complete Your Profile'}
            </CardTitle>
            <p className="text-gray-800 text-sm">
              {isOnboarded 
                ? 'Update your MoodScape profile information'
                : 'Personalize your MoodScape experience'
              }
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                {success}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80 text-gray-800 text-sm"
                  aria-label="Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 text-gray-500 text-sm"
                  aria-label="Email"
                />
              </div>
              <div>
                <label htmlFor="layout" className="block text-sm font-medium text-gray-800 mb-2">
                  Layout Preference
                </label>
                <select
                  id="layout"
                  name="layout"
                  value={layoutPreference}
                  onChange={(e) => setLayoutPreference(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80 text-gray-800 text-sm"
                  aria-label="Layout Preference"
                >
                  <option value="cards">Cards</option>
                  <option value="list">List</option>
                </select>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-800 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={languagePreference}
                  onChange={(e) => setLanguagePreference(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80 text-gray-800 text-sm"
                  aria-label="Language"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="analytics"
                  name="analytics"
                  type="checkbox"
                  checked={allowAnalytics}
                  onChange={(e) => setAllowAnalytics(e.target.checked)}
                  className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  aria-label="Allow Analytics"
                />
                <label htmlFor="analytics" className="text-sm font-medium text-gray-800">
                  Allow Analytics
                </label>
              </div>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-800 mb-2">
                  PIN (4 digits for security)
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Restrict to 4 digits
                    setPin(value);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80 text-gray-800 text-sm"
                  aria-label="PIN"
                />
              </div>
              <div>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-800 hover:bg-gray-50 mb-4"
                >
                  Export Data
                </Button>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-800 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save profile"
                >
                  {saving ? 'Saving...' : (isOnboarded ? 'Update Profile' : 'Save Profile')}
                  {!saving && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}