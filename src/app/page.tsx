'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Smile, BookOpen, Target, ArrowRight, LogOut, User, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient, AuthError, PostgrestError } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define proper types
interface SessionData {
  session: UserSession | null;
}

interface UserSession {
  user: {
    id: string;
    email: string | undefined;
  };
}

interface UserData {
  id: string;
  email: string;
  name: string;
  login_count: number;
  first_login_at: string;
  last_login_at: string;
  is_onboarded: boolean;
  timezone: string;
  created_at?: string;
}

interface DatabaseResponse<T> {
  data: T | null;
  error: AuthError | PostgrestError | null;
}

interface AuthSubscription {
  unsubscribe: () => void;
}

// User status interface
interface UserStatus {
  isFirstTimeVisitor: boolean;
  isOnboarded: boolean;
  hasTrackedMood: boolean;
  daysSinceJoined: number;
  loginCount: number;
}

// Mood emoji interface
interface MoodEmoji {
  emoji: string;
  value: number;
  label: string;
}

// Testimonial interface
interface Testimonial {
  quote: string;
  author: string;
}

// Goal interface
interface Goal {
  goal: string;
}

// Sample daily quotes
const dailyQuotes: string[] = [
  "You are enough just as you are.",
  "Every day is a new opportunity for growth.",
  "Your mental health matters.",
  "Take a deep breath and keep going."
];

// Sample testimonials
const testimonials: Testimonial[] = [
  { quote: "MoodScape helped me understand my emotions better!", author: "Anonymous User" },
  { quote: "The daily prompts make journaling so easy!", author: "Jane D." },
  { quote: "Tracking my mood has been a game-changer.", author: "Sam K." }
];

// Mood emojis for quick check-in
const moodEmojis: MoodEmoji[] = [
  { emoji: "😊", value: 8, label: "Happy" },
  { emoji: "😢", value: 3, label: "Sad" },
  { emoji: "😣", value: 4, label: "Anxious" },
  { emoji: "😤", value: 2, label: "Angry" },
  { emoji: "😴", value: 5, label: "Tired" }
];

export default function Home() {
  const [name, setName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  const [moodNotes, setMoodNotes] = useState<string>('');
  const [dailyQuote, setDailyQuote] = useState<string>('');
  const [dailyGoals, setDailyGoals] = useState<string[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev: number) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Function to extract name from email safely
  const extractNameFromEmail = (email: string | undefined): string => {
    if (!email) return 'User';
    try {
      return email
        .split('@')[0]
        .split('.')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    } catch (error) {
      console.error('Error extracting name from email:', error);
      return 'User';
    }
  };

  // Function to get user journey status
  const getUserJourneyStatus = async (userId: string): Promise<UserStatus | null> => {
    console.log('Starting getUserJourneyStatus for userId:', userId);
    
    try {
      if (!userId) {
        console.error('No userId provided');
        return {
          isFirstTimeVisitor: true,
          isOnboarded: false,
          hasTrackedMood: false,
          daysSinceJoined: 0,
          loginCount: 0
        };
      }

      console.log('Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', {
          code: sessionError.code || 'unknown',
          message: sessionError.message || 'Unknown session error'
        });
        return {
          isFirstTimeVisitor: true,
          isOnboarded: false,
          hasTrackedMood: false,
          daysSinceJoined: 0,
          loginCount: 0
        };
      }

      if (!session) {
        console.log('No active session found');
        return {
          isFirstTimeVisitor: true,
          isOnboarded: false,
          hasTrackedMood: false,
          daysSinceJoined: 0,
          loginCount: 0
        };
      }

      console.log('Session found, fetching user data...');
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('login_count, is_onboarded, created_at, first_login_at, last_login_at, name')
        .eq('id', userId)
        .single();

      console.log('User query result:', { user, userError: userError?.code });

      let finalUser = user;

      if (userError && userError.code === 'PGRST116') {
        console.log('User not found, creating new user...');
        const currentTime = new Date().toISOString();
        const newUserData = {
          id: userId,
          email: session.user.email || 'unknown@example.com',
          name: extractNameFromEmail(session.user.email),
          login_count: 1,
          first_login_at: currentTime,
          last_login_at: currentTime,
          is_onboarded: false,
          timezone: 'UTC'
        };

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select('login_count, is_onboarded, created_at, first_login_at, last_login_at, name')
          .single();

        if (createError) {
          console.error('Error creating user:', {
            code: createError.code || 'unknown',
            message: createError.message || 'Unknown create error',
            details: createError.details || 'No details'
          });
          return {
            isFirstTimeVisitor: true,
            isOnboarded: false,
            hasTrackedMood: false,
            daysSinceJoined: 0,
            loginCount: 1
          };
        }
        finalUser = newUser;
        console.log('New user created successfully');
      } else if (userError) {
        console.error('Error fetching user:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint
        });
        return {
          isFirstTimeVisitor: true,
          isOnboarded: false,
          hasTrackedMood: false,
          daysSinceJoined: 0,
          loginCount: 0
        };
      } else if (finalUser) {
        console.log('Existing user found, updating login count...');
        const currentTime = new Date().toISOString();
        const newLoginCount = (finalUser.login_count || 0) + 1;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            login_count: newLoginCount,
            last_login_at: currentTime
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user login:', {
            code: updateError.code || 'unknown',
            message: updateError.message || 'Unknown update error'
          });
        } else {
          finalUser.login_count = newLoginCount;
          finalUser.last_login_at = currentTime;
          console.log('User login count updated successfully');
        }
      }

      if (!finalUser) {
        console.log('No user data available after all operations');
        return {
          isFirstTimeVisitor: true,
          isOnboarded: false,
          hasTrackedMood: false,
          daysSinceJoined: 0,
          loginCount: 0
        };
      }

      const joinDate = finalUser.first_login_at || finalUser.created_at;
      const daysSinceJoined = joinDate
        ? Math.floor((new Date().getTime() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Set the name from the database if available
      if (finalUser.name) {
        setName(finalUser.name);
      }

      console.log('getUserJourneyStatus completed successfully');
      return {
        isFirstTimeVisitor: (finalUser.login_count || 0) <= 1,
        isOnboarded: finalUser.is_onboarded || false,
        hasTrackedMood: false, // TODO: Implement mood tracking check
        daysSinceJoined,
        loginCount: finalUser.login_count || 0
      };

    } catch (error: unknown) {
      console.error('Unexpected error in getUserJourneyStatus:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return {
        isFirstTimeVisitor: true,
        isOnboarded: false,
        hasTrackedMood: false,
        daysSinceJoined: 0,
        loginCount: 0
      };
    }
  };

  // Fetch daily goals (mock for now)
  const fetchDailyGoals = async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        console.error('No userId provided for fetching goals');
        setDailyGoals([]);
        return;
      }

      // Mock goals for now - replace with actual database query
      const mockGoals: Goal[] = [
        { goal: "Practice mindfulness for 10 minutes" },
        { goal: "Write in journal" },
        { goal: "Take a walk outside" }
      ];
      setDailyGoals(mockGoals.map((g: Goal) => g.goal));
    } catch (error: unknown) {
      console.error('Error fetching daily goals:', error);
      setDailyGoals([]);
    }
  };

  useEffect(() => {
    // Set daily quote
    setDailyQuote(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);

    // Handle URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const nameFromUrl = urlParams.get('name') || '';
    const loginSuccess = urlParams.get('login');

    if (nameFromUrl) {
      setName(nameFromUrl);
    }

    if (loginSuccess === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const getSessionAndStatus = async (): Promise<void> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          return;
        }

        if (session?.user?.id) {
          const userId = session.user.id;
          const userEmail = session.user.email;
          
          setIsLoggedIn(true);

          // Fetch user status without redirect
          try {
            const status = await getUserJourneyStatus(userId);
            console.log('User status:', status);
            setUserStatus(status);
            await fetchDailyGoals(userId);
          } catch (statusError) {
            console.error('Error getting user status:', statusError);
          }
        }
        
        setLoading(false);
      } catch (err: unknown) {
        console.error('Error in getSessionAndStatus:', err);
        setLoading(false);
      }
    };

    getSessionAndStatus();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        const userId = session.user.id;
        
        setIsLoggedIn(true);

        try {
          const status = await getUserJourneyStatus(userId);
          console.log('User status after login:', status);
          setUserStatus(status);
          await fetchDailyGoals(userId);
        } catch (statusError) {
          console.error('Error getting user status after login:', statusError);
        }
      } else if (event === 'SIGNED_OUT') {
        setName('');
        setIsLoggedIn(false);
        setUserStatus(null);
        setDailyGoals([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setName('');
        setIsLoggedIn(false);
        setUserStatus(null);
        setDailyGoals([]);
      }
    } catch (err: unknown) {
      console.error('Unexpected error during logout:', err);
    }
  };

  const saveActivity = async (): Promise<void> => {
    try {
      if (!selectedMood) {
        alert('Please select a mood before saving.');
        return;
      }

      // Save mood to database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        alert('Please log in to save your mood.');
        return;
      }

      const { error } = await supabase
        .from('moods')
        .insert({
          user_id: session.user.id,
          mood: selectedMood.value,
          tags: [selectedMood.label],
          notes: moodNotes || null,
          logged_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving mood:', error);
        alert('Failed to save mood. Please try again.');
        return;
      }

      alert('Mood saved successfully!');
      setSelectedMood(null);
      setMoodNotes('');
      
      // Refresh user status after saving mood
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            const updatedStatus = await getUserJourneyStatus(session.user.id);
            setUserStatus(updatedStatus);
          }
        } catch (error) {
          console.error('Error refreshing user status after mood save:', error);
        }
      }, 500);
    } catch (err: unknown) {
      console.error('Unexpected error in saveActivity:', err);
      alert('Unexpected error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6 mx-auto animate-pulse">
            <Heart className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <p className="text-gray-800 text-xl font-medium">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-100/10 to-cyan-100/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-lg" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
                <Heart className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MoodScape
              </span>
            </div>
            <div className="flex items-center space-x-6">
              {isLoggedIn ? (
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-teal-300 text-teal-800 hover:bg-teal-50 rounded-xl px-6 py-3 font-semibold text-lg bg-white/80 transform hover:scale-105 transition-all duration-200"
                    onClick={() => window.location.href = '/profilesetup'}
                  >
                    <User className="h-5 w-5 mr-2" aria-hidden="true" />
                    {userStatus?.isOnboarded ? 'Edit Profile' : 'Profile Setup'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-blue-300 text-blue-800 hover:bg-blue-50 rounded-xl px-6 py-3 font-semibold text-lg bg-white/80 transform hover:scale-105 transition-all duration-200"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <Target className="h-5 w-5 mr-2" aria-hidden="true" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="lg"
                    className="border-gray-300 text-gray-800 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold text-lg bg-white/80 transform hover:scale-105 transition-all duration-200"
                    aria-label="Log out"
                  >
                    <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl px-8 py-3 text-lg transform hover:scale-105 transition-all duration-200 shadow-lg" 
                  aria-label="Log in"
                  onClick={() => window.location.href = '/login'}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-24">
        {/* User Greeting Section */}
        {isLoggedIn && name && (
          <section className="py-8 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 backdrop-blur-sm border-b border-teal-100/50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-teal-200/50 rounded-2xl px-8 py-4 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-2xl font-bold text-gray-800">Hello {name}!</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="py-16 lg:py-24 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div className="space-y-8 relative z-10">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-full px-6 py-3 shadow-lg">
                  <Sparkles className="h-5 w-5 text-teal-600 animate-pulse" aria-hidden="true" />
                  <span className="text-teal-800 text-base font-semibold">
                    Your mental wellness journey starts here
                  </span>
                </div>

                <div>
                  <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
                    Take Care Of Your
                    <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Mental Wellness
                    </span>
                  </h1>
                  <p className="text-2xl text-gray-700 leading-relaxed max-w-xl font-medium">
                    Track your mood, journal your thoughts, and set goals with AI-powered insights to transform your mental health journey.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-10 py-5 font-bold rounded-2xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
                    aria-label="Track your mood"
                    onClick={() => window.location.href = '/trackmood'}
                  >
                    <Smile className="h-6 w-6 mr-3" />
                    Track Mood
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-5 font-bold rounded-2xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
                    aria-label="Start journaling"
                    onClick={() => window.location.href = '/journal'}
                  >
                    <BookOpen className="h-6 w-6 mr-3" />
                    Start Journaling
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-10 py-5 font-bold rounded-2xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-3xl"
                    aria-label="Set goals"
                    onClick={() => window.location.href = '/setgoals'}
                  >
                    <Target className="h-6 w-6 mr-3" />
                    Set Goals
                  </Button>
                </div>

                {/* Daily Quote/Affirmation */}
                <Card className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-2xl transform hover:scale-102 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Daily Inspiration</h3>
                        <p className="text-xl font-semibold text-gray-800 italic" aria-label="Daily affirmation">
                          {dailyQuote}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Mood Check-In for All Logged-In Users */}
                {isLoggedIn && (
                  <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-102 transition-all duration-300">
                    <CardHeader className="pb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Heart className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-900">Quick Mood Check-In</CardTitle>
                          <p className="text-gray-700 text-lg font-medium">How are you feeling today?</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 mb-6" role="radiogroup" aria-label="Select your mood">
                        {moodEmojis.map((mood: MoodEmoji) => (
                          <Button
                            key={mood.emoji}
                            variant={selectedMood?.emoji === mood.emoji ? "default" : "outline"}
                            className={`text-3xl p-4 h-16 w-16 rounded-2xl transform hover:scale-110 transition-all duration-200 ${selectedMood?.emoji === mood.emoji ? 'bg-teal-600 text-white shadow-lg scale-110' : 'bg-white/80 text-gray-800 border-gray-300 hover:border-teal-400'}`}
                            onClick={() => setSelectedMood(mood)}
                            aria-label={`Select ${mood.label} mood`}
                            role="radio"
                            aria-checked={selectedMood?.emoji === mood.emoji}
                          >
                            {mood.emoji}
                          </Button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={moodNotes}
                        onChange={(e) => setMoodNotes(e.target.value)}
                        placeholder="Optional: Add a note about your mood..."
                        className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/30 focus:border-teal-500 bg-white/90 text-gray-800 text-lg mb-6 font-medium"
                        aria-label="Mood notes"
                      />
                      <Button
                        onClick={saveActivity}
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-4 rounded-2xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                        disabled={!selectedMood}
                        aria-label="Save mood"
                      >
                        Save Mood
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Visual Section */}
              <div className="flex items-center justify-center relative">
                <div className="relative">
                  {/* Main visual element */}
                  <div className="w-96 h-96 bg-gradient-to-br from-teal-100/60 to-cyan-100/60 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/50 transform hover:rotate-2 transition-all duration-500">
                    <div className="w-64 h-64 bg-gradient-to-br from-teal-200/80 to-cyan-200/80 rounded-2xl flex items-center justify-center shadow-xl">
                      <Heart className="w-32 h-32 text-teal-600 animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl animate-bounce delay-500">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute top-1/2 -left-12 w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl animate-bounce delay-1000">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Features Section */}
        <section className="py-24 bg-gradient-to-r from-white/60 to-teal-50/60 backdrop-blur-sm relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Why Choose MoodScape?</h2>
              <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
                Discover a comprehensive platform designed to nurture your mental wellness with cutting-edge AI insights and personalized experiences.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Smile className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Mood Tracking</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Experience intuitive emoji-based mood logging with AI-powered pattern recognition that reveals meaningful insights about your emotional journey.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Journaling</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Unlock deeper self-reflection with personalized AI prompts that guide your journaling practice in a secure, private environment.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Personalized Goals</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Set meaningful wellness objectives with intelligent tracking systems that adapt to your progress and celebrate your achievements.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-br from-teal-50/40 to-cyan-50/40 backdrop-blur-sm relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">What Our Users Say</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of users who have transformed their mental wellness journey with MoodScape.
              </p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 transform hover:scale-102 transition-all duration-300">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <span className="text-3xl">⭐</span>
                  </div>
                  <blockquote className="text-2xl font-semibold text-gray-800 italic mb-8 leading-relaxed" aria-live="polite">
                    {testimonials[currentTestimonial].quote}
                  </blockquote>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {testimonials[currentTestimonial].author}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Testimonial indicators */}
              <div className="flex justify-center space-x-3 mt-8">
                {testimonials.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial ? 'bg-teal-600 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isLoggedIn && (
          <section className="py-24 bg-gradient-to-r from-teal-600 to-cyan-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
              <h2 className="text-5xl font-bold text-white mb-8">Ready to Start Your Journey?</h2>
              <p className="text-2xl text-teal-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join MoodScape today and take the first step towards better mental wellness with our comprehensive tracking and AI-powered insights.
              </p>
              <Button
                size="lg"
                className="bg-white text-teal-600 hover:bg-gray-50 font-bold px-12 py-6 rounded-2xl text-2xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => window.location.href = '/login'}
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-20 bg-gray-900 text-white relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Heart className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <span className="text-3xl font-bold">MoodScape</span>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-400 text-center text-lg">
                © 2025 MoodScape. All rights reserved. | Empowering mental wellness through technology.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}