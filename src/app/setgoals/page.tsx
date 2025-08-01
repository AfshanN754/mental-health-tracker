'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase-client'; // Changed to match journal import
import { 
  Heart, 
  Target, 
  User, 
  LogOut, 
  ArrowLeft,
  Plus,
  Calendar,
  Trophy,
  Star,
  CheckCircle,
  Circle,
  Trash2,
  Edit,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Gift,
  Sparkles,
  Rocket,
  Mountain,
  Loader2
} from 'lucide-react';

interface GoalCategory {
  name: string;
  emoji: string;
  color: string;
  gradient: string;
}

interface PriorityLevel {
  name: string;
  value: string;
  color: string;
  emoji: string;
  gradient: string;
}

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  reward: string | null;
}

const goalCategories: GoalCategory[] = [
  { name: 'Health & Fitness', emoji: '💪', color: 'bg-green-100 text-green-800 border-green-200', gradient: 'from-green-400 to-emerald-500' },
  { name: 'Mental Wellness', emoji: '🧘‍♀️', color: 'bg-purple-100 text-purple-800 border-purple-200', gradient: 'from-purple-400 to-pink-500' },
  { name: 'Career & Work', emoji: '💼', color: 'bg-blue-100 text-blue-800 border-blue-200', gradient: 'from-blue-400 to-indigo-500' },
  { name: 'Relationships', emoji: '💕', color: 'bg-pink-100 text-pink-800 border-pink-200', gradient: 'from-pink-400 to-rose-500' },
  { name: 'Learning & Growth', emoji: '📚', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', gradient: 'from-yellow-400 to-orange-500' },
  { name: 'Hobbies & Fun', emoji: '🎨', color: 'bg-orange-100 text-orange-800 border-orange-200', gradient: 'from-orange-400 to-red-500' },
  { name: 'Finance', emoji: '💰', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', gradient: 'from-emerald-400 to-teal-500' },
  { name: 'Home & Lifestyle', emoji: '🏠', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', gradient: 'from-indigo-400 to-purple-500' },
];

const priorityLevels: PriorityLevel[] = [
  { name: 'Low', value: 'low', color: 'bg-gray-100 text-gray-600', emoji: '⚪', gradient: 'from-gray-300 to-gray-400' },
  { name: 'Medium', value: 'medium', color: 'bg-yellow-100 text-yellow-700', emoji: '🟡', gradient: 'from-yellow-400 to-yellow-500' },
  { name: 'High', value: 'high', color: 'bg-orange-100 text-orange-700', emoji: '🟠', gradient: 'from-orange-400 to-orange-500' },
  { name: 'Critical', value: 'critical', color: 'bg-red-100 text-red-700', emoji: '🔴', gradient: 'from-red-400 to-red-500' },
];

const motivationalStickers: string[] = [
  '🎯', '⭐', '🏆', '💪', '🚀', '✨', '🌟', '🎉', '🎊', '🔥',
  '💎', '🏅', '👑', '🎁', '🌈', '🦋', '🌸', '☀️', '🌙', '⚡'
];

const rewardIdeas: string[] = [
  '🍦 Treat yourself to ice cream',
  '🎬 Watch your favorite movie',
  '🛍️ Buy something you\'ve wanted',
  '🌴 Plan a small trip',
  '📚 Buy a new book',
  '☕ Visit a nice café',
  '🎵 Concert or music event',
  '🧘‍♀️ Spa day at home'
];

export default function SetGoals() {
  const router = useRouter();

  // Authentication states - copied from journal page
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');

  // Goal states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<string>('');
  const [newGoalPriority, setNewGoalPriority] = useState<string>('medium');
  const [newGoalDeadline, setNewGoalDeadline] = useState<string>('');
  const [newGoalDescription, setNewGoalDescription] = useState<string>('');
  const [newGoalReward, setNewGoalReward] = useState<string>('');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication logic copied from journal page
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchUser = async () => {
      try {
        setIsAuthLoading(true);
        console.log('Checking authentication...');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError.message);
          if (isMounted) setIsAuthLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('No active session found');
          if (isMounted) setIsAuthLoading(false);
          return;
        }

        const currentUserId = session.user.id;
        console.log('User authenticated with ID:', currentUserId);

        if (isMounted) {
          setUserId(currentUserId);
          setIsAuthenticated(true);
        }

        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('name')
            .eq('id', currentUserId)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError.message);
            if (profileError.code === 'PGRST116') {
              const displayName = session.user.email?.split('@')[0] || 'User';
              if (isMounted) setUserName(displayName);
            }
          } else if (profileData && isMounted) {
            const displayName = profileData.name || session.user.email?.split('@')[0] || 'User';
            setUserName(displayName);
          }
        } catch (profileErr) {
          console.error('Unexpected profile fetch error:', profileErr);
          if (isMounted) {
            const displayName = session.user.email?.split('@')[0] || 'User';
            setUserName(displayName);
          }
        }

        // Fetch goals after authentication
        await fetchGoals(currentUserId);

      } catch (err) {
        console.error('Error in auth check:', err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (isMounted) {
        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          setUserId(null);
          setUserName('User');
          setTimeout(() => router.replace('/login'), 0);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUserId(session.user.id);
            setIsAuthenticated(true);
            checkAuthAndFetchUser();
          }
        }
      }
    });

    checkAuthAndFetchUser();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Fetch goals function
  const fetchGoals = async (user_id: string) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error.message || error);
        return;
      }

      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  // Loading state - copied from journal page
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 flex items-center justify-center relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full blur-lg opacity-50 animate-spin"></div>
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-white relative z-10" />
          </div>
          <p className="text-white text-xl font-medium animate-bounce">Loading your goals...</p>
          <div className="flex space-x-1 justify-center mt-4">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddGoal = async (): Promise<void> => {
    if (!newGoal || !newGoalCategory || !userId) {
      setError('Please fill in required fields!');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const insertData = {
        user_id: userId,
        title: newGoal.trim(),
        description: newGoalDescription.trim(),
        category: newGoalCategory,
        priority: newGoalPriority,
        target_date: newGoalDeadline || null,
        completed: false,
        completed_at: null,
        progress: 0,
        reward: newGoalReward || null,
        created_at: new Date().toISOString(),
      };

      console.log('Saving goal:', insertData);

      const { data, error: insertError } = await supabase
        .from('goals')
        .insert([insertData])
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase insertion error:', insertError);
        if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
          setError('Database table "goals" not found. Please check your database setup.');
        } else if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          setError(`Database column error: ${insertError.message}. Please check your table structure.`);
        } else if (insertError.code === '23505') {
          setError('A goal with this information already exists.');
        } else {
          setError(`Failed to save goal: ${insertError.message}`);
        }
      } else {
        console.log('Successfully saved goal:', data);
        setGoals([data, ...goals]);
        resetForm();
        setError(null);
        alert('Goal added successfully! 🎉');
      }
    } catch (err) {
      console.error('Unexpected error in handleAddGoal:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (): void => {
    setNewGoal('');
    setNewGoalCategory('');
    setNewGoalPriority('medium');
    setNewGoalDeadline('');
    setNewGoalDescription('');
    setNewGoalReward('');
    setSelectedStickers([]);
    setShowAddForm(false);
  };

  const handleToggleComplete = async (id: string): Promise<void> => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    setSaving(true);
    try {
      const completed = !goal.completed;
      const now = new Date().toISOString();
      const updates = {
        completed,
        completed_at: completed ? now : null,
        progress: completed ? 100 : goal.progress,
        updated_at: now
      };

      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating goal:', error.message || error);
        setError(`Failed to update goal: ${error.message}`);
        return;
      }

      setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
      
      if (completed) {
        alert('Congratulations! Goal completed! 🎉🏆');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      setError('Failed to update goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting goal:', error.message || error);
        setError(`Failed to delete goal: ${error.message}`);
        return;
      }

      setGoals(goals.filter(g => g.id !== id));
      alert('Goal deleted successfully.');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setError('Failed to delete goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (id: string, progress: number): Promise<void> => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    setSaving(true);
    try {
      const newProgress = Math.min(100, Math.max(0, progress));
      const now = new Date().toISOString();
      const updates = {
        progress: newProgress,
        updated_at: now
      };

      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating progress:', error.message || error);
        setError(`Failed to update progress: ${error.message}`);
        return;
      }

      setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSticker = (sticker: string): void => {
    if (!selectedStickers.includes(sticker)) {
      setSelectedStickers([...selectedStickers, sticker]);
    }
  };

  const removeSticker = (sticker: string): void => {
    setSelectedStickers(selectedStickers.filter((s: string) => s !== sticker));
  };

  const getCategoryInfo = (categoryName: string): GoalCategory => {
    return goalCategories.find((cat: GoalCategory) => cat.name === categoryName) || goalCategories[0];
  };

  const getPriorityInfo = (priorityValue: string): PriorityLevel => {
    return priorityLevels.find((p: PriorityLevel) => p.value === priorityValue) || priorityLevels[1];
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error);
    } catch (err) {
      console.error('Unexpected logout error:', err);
      router.replace('/login');
    }
  };

  const completedGoals: number = goals.filter((goal: Goal) => goal.completed).length;
  const totalGoals: number = goals.length;
  const overallProgress: number = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Error message with glassmorphism */}
      {error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-red-500/20 backdrop-blur-xl border border-red-300/30 rounded-2xl text-red-800 text-sm max-w-md text-center shadow-2xl animate-slide-down">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg hover:scale-110 transition-all">×</button>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header with glassmorphism effect */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
              <Heart className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                MoodScape
              </h1>
              <p className="text-xs text-gray-500 font-medium">Goal Achievement Hub</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-teal-600 border-teal-200 hover:bg-teal-50 backdrop-blur-sm bg-white/50 transition-all duration-300 hover:scale-105"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Homepage
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-purple-600 border-purple-200/50 hover:bg-purple-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
              onClick={() => router.push('/profilesetup')}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 shadow-lg">
              <span className="text-sm text-gray-700 font-medium">Hello, <span className="text-teal-600 font-semibold">{userName}</span>! ✨</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all duration-300" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section with improved animations */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse absolute -top-4 -left-4" />
              <Star className="w-4 h-4 text-blue-400 animate-pulse absolute -top-2 right-8 delay-300" />
              <Rocket className="w-5 h-5 text-purple-400 animate-bounce absolute -bottom-2 -right-2 delay-500" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Achieve Your{' '}
              <span className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Dreams & Goals
              </span>
              <Mountain className="inline-block w-8 h-8 ml-2 text-teal-500 animate-bounce" />
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your aspirations into reality with our{' '}
              <span className="font-semibold text-teal-600">comprehensive goal management system</span>.
              Set meaningful targets, track progress, and celebrate every victory! 🎉
            </p>
          </div>

          {/* Enhanced Stats Overview with hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="group bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Total Goals</p>
                    <p className="text-3xl font-bold animate-pulse">{totalGoals}</p>
                    <p className="text-xs text-teal-200 mt-1">Your journey awaits!</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Target className="w-8 h-8 text-teal-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="group bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold animate-pulse">{completedGoals}</p>
                    <p className="text-xs text-green-200 mt-1">Victories unlocked! 🏆</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <CheckCircle className="w-8 h-8 text-green-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Success Rate</p>
                    <p className="text-3xl font-bold animate-pulse">{Math.round(overallProgress)}%</p>
                    <p className="text-xs text-purple-200 mt-1">Keep pushing! 💪</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-purple-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Streak</p>
                    <p className="text-3xl font-bold animate-pulse">7 days</p>
                    <p className="text-xs text-orange-200 mt-1">On fire! 🔥</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Zap className="w-8 h-8 text-orange-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Add New Goal Form */}
            <div className="lg:col-span-1">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl sticky top-4 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
                  <CardTitle className="text-xl font-bold flex items-center">
                    <div className="bg-white/20 p-2 rounded-xl mr-3 animate-pulse">
                      <Plus className="w-6 h-6" />
                    </div>
                    Create New Goal
                    <Sparkles className="w-5 h-5 ml-2 animate-spin" />
                  </CardTitle>
                  <p className="text-teal-100 text-sm">Turn your dreams into achievements!</p>
                </CardHeader>
                <CardContent className="space-y-6 p-6 relative z-10">
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center">
                      <Target className="w-4 h-4 mr-2 text-teal-500" />
                      Goal Title
                    </label>
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="e.g., Exercise 30 minutes daily 💪"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-lg group-hover:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                      <Select value={newGoalCategory} onValueChange={setNewGoalCategory}>
                        <SelectTrigger className="border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                          {goalCategories.map((category: GoalCategory) => (
                            <SelectItem key={category.name} value={category.name} className="rounded-lg hover:bg-teal-50 transition-colors duration-200">
                              <span className="text-lg mr-2">{category.emoji}</span>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Priority</label>
                      <Select value={newGoalPriority} onValueChange={setNewGoalPriority}>
                        <SelectTrigger className="border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                          {priorityLevels.map((priority: PriorityLevel) => (
                            <SelectItem key={priority.value} value={priority.value} className="rounded-lg hover:bg-teal-50 transition-colors duration-200">
                              <span className="text-lg mr-2">{priority.emoji}</span>
                              {priority.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-teal-500" />
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Description</label>
                    <Textarea
                      value={newGoalDescription}
                      onChange={(e) => setNewGoalDescription(e.target.value)}
                      placeholder="Describe your goal in detail... 📝"
                      className="resize-none h-24 border-2 border-gray-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center">
                      <Gift className="w-4 h-4 mr-2 text-teal-500" />
                      Reward Yourself
                    </label>
                    <Select value={newGoalReward} onValueChange={setNewGoalReward}>
                      <SelectTrigger className="border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300">
                        <SelectValue placeholder="Pick a reward 🎁" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                        {rewardIdeas.map((reward: string) => (
                          <SelectItem key={reward} value={reward} className="rounded-lg hover:bg-teal-50 transition-colors duration-200">
                            {reward}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center">
                      <Star className="w-4 h-4 mr-2 text-teal-500" />
                      Add Motivation Stickers
                    </label>
                    <div className="grid grid-cols-10 gap-1 mb-3 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border-2 border-teal-100">
                      {motivationalStickers.map((sticker: string) => (
                        <button
                          key={sticker}
                          onClick={() => addSticker(sticker)}
                          className="text-2xl hover:bg-white hover:scale-125 p-2 rounded-xl transition-all duration-300 hover:shadow-lg transform"
                          title="Add sticker"
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                    {selectedStickers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedStickers.map((sticker: string) => (
                          <button
                            key={sticker}
                            onClick={() => removeSticker(sticker)}
                            className="bg-gradient-to-r from-teal-100 to-blue-100 text-teal-800 px-3 py-2 rounded-xl text-sm hover:from-teal-200 hover:to-blue-200 transition-all duration-300 transform hover:scale-110 shadow-md border border-teal-200"
                          >
                            {sticker} ×
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddGoal} 
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl border-0"
                    disabled={!newGoal || !newGoalCategory || saving}
                  >
                    <Target className="mr-2 h-5 w-5 animate-pulse" />
                    {saving ? 'Creating Goal...' : 'Create Goal'}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Goals List */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-blue-50/30"></div>
                <CardHeader className="relative z-10 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
                  <CardTitle className="text-2xl font-bold flex items-center justify-between">
                    <span className="flex items-center">
                      <div className="bg-white/20 p-2 rounded-xl mr-3 animate-pulse">
                        <Trophy className="w-6 h-6" />
                      </div>
                      Your Goals ({goals.length})
                      <Sparkles className="w-5 h-5 ml-2 animate-spin" />
                    </span>
                    <div className="text-sm text-teal-100 bg-white/20 px-3 py-1 rounded-full">
                      {completedGoals}/{totalGoals} completed
                    </div>
                  </CardTitle>
                  <p className="text-teal-100 text-sm">Your journey to success starts here!</p>
                </CardHeader>
                <CardContent className="p-6 relative z-10">
                  {goals.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="relative mb-6">
                        <Target className="w-20 h-20 text-gray-300 mx-auto animate-pulse" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <Plus className="w-4 h-4 text-teal-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">No goals yet</h3>
                      <p className="text-gray-500 text-lg">Create your first goal to get started on your amazing journey!</p>
                      <div className="mt-4 flex justify-center space-x-2">
                        <span className="text-2xl animate-bounce">🚀</span>
                        <span className="text-2xl animate-bounce delay-100">⭐</span>
                        <span className="text-2xl animate-bounce delay-200">🎯</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {goals.map((goal: Goal) => {
                        const categoryInfo: GoalCategory = getCategoryInfo(goal.category);
                        const priorityInfo: PriorityLevel = getPriorityInfo(goal.priority);
                        const isOverdue: boolean = Boolean(goal.target_date && new Date(goal.target_date) < new Date() && !goal.completed);
                        
                        return (
                          <div
                            key={goal.id}
                            className={`group p-6 rounded-3xl border-2 transition-all duration-500 hover:shadow-2xl transform hover:scale-102 relative overflow-hidden ${
                              goal.completed 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100' 
                                : isOverdue 
                                ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-red-100'
                                : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-teal-300'
                            }`}
                          >
                            {/* Decorative gradient overlay */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${categoryInfo.gradient} opacity-5`}></div>
                            
                            <div className="flex items-start justify-between mb-4 relative z-10">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <button
                                    onClick={() => handleToggleComplete(goal.id)}
                                    className={`transition-all duration-300 transform hover:scale-110 ${
                                      goal.completed ? 'text-green-600' : 'text-gray-400 hover:text-teal-500'
                                    }`}
                                    disabled={saving}
                                  >
                                    {goal.completed ? (
                                      <div className="relative">
                                        <CheckCircle className="w-7 h-7" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                          <Crown className="w-2 h-2 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <Circle className="w-7 h-7" />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <h3 className={`text-xl font-bold ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {goal.title}
                                    </h3>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                  <span className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 shadow-lg ${categoryInfo.color} hover:scale-105 transition-transform duration-200`}>
                                    <span className="text-lg mr-2">{categoryInfo.emoji}</span>
                                    {goal.category}
                                  </span>
                                  <span className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 shadow-lg ${priorityInfo.color} hover:scale-105 transition-transform duration-200`}>
                                    <span className="text-lg mr-2">{priorityInfo.emoji}</span>
                                    {priorityInfo.name}
                                  </span>
                                  {goal.target_date && (
                                    <span className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 shadow-lg hover:scale-105 transition-transform duration-200 ${
                                      isOverdue ? 'bg-red-100 text-red-700 border-red-300' : 'bg-blue-100 text-blue-700 border-blue-300'
                                    }`}>
                                      <Calendar className="w-4 h-4 inline mr-2" />
                                      {new Date(goal.target_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {goal.description && (
                                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-gray-200">
                                    <p className="text-gray-700 leading-relaxed">{goal.description}</p>
                                  </div>
                                )}

                                {!goal.completed && (
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-3">
                                      <span className="flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2 text-teal-500" />
                                        Progress
                                      </span>
                                      <span className="text-lg font-bold text-teal-600">{goal.progress}%</span>
                                    </div>
                                    <div className="relative">
                                      <Progress value={goal.progress} className="h-4 rounded-full" />
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 opacity-75" style={{width: `${goal.progress}%`}}></div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateProgress(goal.id, Math.min(100, goal.progress + 25))}
                                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 rounded-xl font-semibold"
                                        disabled={saving}
                                      >
                                        +25% 📈
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateProgress(goal.id, Math.max(0, goal.progress - 25))}
                                        className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 text-orange-700 hover:from-orange-100 hover:to-red-100 transition-all duration-300 rounded-xl font-semibold"
                                        disabled={saving}
                                      >
                                        -25% 📉
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {goal.reward && (
                                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-4 mb-4 shadow-lg">
                                    <p className="text-yellow-800 font-semibold flex items-center">
                                      <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                                      <strong>Your Reward:</strong>
                                      <span className="ml-2 text-lg">{goal.reward}</span>
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-6 relative z-10">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-all duration-300 transform hover:scale-110"
                                  disabled={saving}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>

                            {goal.completed && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-4 text-center shadow-lg animate-pulse">
                                <div className="flex items-center justify-center space-x-2">
                                  <Crown className="w-6 h-6 text-yellow-500 animate-bounce" />
                                  <span className="text-green-800 font-bold text-lg">🎉 Goal Achieved! Fantastic work! 🎉</span>
                                  <Trophy className="w-6 h-6 text-yellow-500 animate-bounce delay-200" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Motivational Section */}
              {completedGoals > 0 && (
                <Card className="mt-8 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 border-2 border-teal-200 shadow-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-purple-400/10 animate-pulse"></div>
                  <CardContent className="p-8 text-center relative z-10">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <Award className="w-16 h-16 text-teal-500 animate-bounce" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      Amazing Progress! 🌟
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
                      You have completed <span className="font-bold text-teal-600 text-xl">{completedGoals}</span> goal{completedGoals !== 1 ? 's' : ''}! 
                      Keep up the fantastic work and stay committed to your journey of growth and success.
                    </p>
                    <div className="flex justify-center space-x-4 mt-6">
                      <span className="text-3xl animate-bounce">🎉</span>
                      <span className="text-3xl animate-bounce delay-100">🚀</span>
                      <span className="text-3xl animate-bounce delay-200">⭐</span>
                      <span className="text-3xl animate-bounce delay-300">🏆</span>
                      <span className="text-3xl animate-bounce delay-400">💪</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes slide-down {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        .animate-slide-down { animation: slide-down 0.5s ease-out; }
      `}</style>
    </div>
  );
}