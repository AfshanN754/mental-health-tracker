'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, BookOpen, Target, Heart, Flame, ArrowLeft, Calendar, Activity, TrendingUp, Brain, Sparkles, Moon } from 'lucide-react';
import { createClient, AuthError, PostgrestError } from '@supabase/supabase-js';
import Chart from 'chart.js/auto';

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
  login_count: number;
  first_login_at: string;
  last_done_at: string;
  is_onboarded: boolean;
  timezone: string;
}

interface Mood {
  id: string;
  user_id: string;
  mood: number;
  intensity: number;
  cause: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood_rating: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
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

interface Activity {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

interface Habit {
  id: string;
  user_id: string;
  habit_type: string;
  streak: number;
  last_done_at: string;
}

interface SleepData {
  id: string;
  user_id: string;
  duration: number;
  quality: number;
  created_at: string;
}

// Define moodOptions locally or import if shared
const moodOptions = [
  { name: 'Happy', value: 8 },
  { name: 'Calm', value: 7 },
  { name: 'Neutral', value: 5 },
  { name: 'Anxious', value: 3 },
  { name: 'Sad', value: 2 },
  { name: 'Panic', value: 1 },
  { name: 'Worried', value: 2 },
];

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHabitManager, setShowHabitManager] = useState<boolean>(false);
  const [newHabitName, setNewHabitName] = useState<string>('');
  const [editingStreak, setEditingStreak] = useState<{ habitId: string; streak: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user?.id) {
          console.error('No session or user ID:', sessionError);
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (userError) throw userError;
        setUser(userData);

        // Fetch moods for the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const { data: moodData, error: moodError } = await supabase
          .from('moods')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', oneWeekAgo.toISOString())
          .order('created_at', { ascending: true });
        if (moodError) throw moodError;
        console.log('Fetched moods:', moodData);
        setMoods(moodData || []);

        // Fetch journal entries
        const { data: journalData, error: journalError } = await supabase
          .from('journals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        if (journalError) throw journalError;
        console.log('Fetched journal entries:', journalData);
        setJournalEntries(journalData);

        // Fetch goals
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (goalError) throw goalError;
        setGoals(goalData);

        // Fetch activities
        const { data: activityData, error: activityError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        if (activityError) throw activityError;
        setActivities(activityData);

        // Fetch sleep data for the last 7 days
        try {
          const { data: sleepDataFromDB, error: sleepError } = await supabase
            .from('sleep')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', oneWeekAgo.toISOString())
            .order('created_at', { ascending: false });
          
          if (sleepError) {
            console.warn('Sleep table not found or error fetching sleep data:', sleepError);
            setSleepData([]);
          } else {
            setSleepData(sleepDataFromDB || []);
          }
        } catch (sleepFetchError) {
          console.warn('Sleep table may not exist:', sleepFetchError);
          setSleepData([]);
        }

        // Fetch habits from database
        try {
          const { data: habitData, error: habitError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('habit_type', { ascending: true });
          
          if (habitError) throw habitError;
          setHabits(habitData || []);
        } catch (habitFetchError) {
          console.error('Failed to fetch habits:', habitFetchError);
          setHabits([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const initializeChart = () => {
    if (!canvasRef.current) {
      console.error('Canvas ref is still null, retrying...');
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for canvas');
      return;
    }

    console.log('Moods data:', moods);
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (moods.length > 0) {
      const moodByDay = moods.reduce((acc, mood) => {
        const date = new Date(mood.created_at).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        if (typeof mood.mood === 'number') acc[date].push(mood.mood);
        else console.warn('Invalid mood value:', mood.mood);
        return acc;
      }, {} as { [key: string]: number[] });

      const labels = Object.keys(moodByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      console.log('Chart labels:', labels);
      const data = labels.map(date => {
        const dailyMoods = moodByDay[date];
        return dailyMoods.length > 0 ? dailyMoods.reduce((sum, m) => sum + m, 0) / dailyMoods.length : 0;
      });
      console.log('Chart data:', data);

      if (labels.length === 0 || data.every(d => d === 0)) {
        console.log('No valid data for chart, showing placeholder');
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['No Data'],
            datasets: [{
              label: 'Average Mood',
              data: [0],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 10,
                title: { display: true, text: 'Mood (1-10)' }
              },
              x: {
                title: { display: true, text: 'Date' }
              }
            },
            plugins: {
              legend: { display: true },
              tooltip: { mode: 'index', intersect: false }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } else {
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Average Mood',
              data: data,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 10,
                title: { display: true, text: 'Mood (1-10)' }
              },
              x: {
                title: { display: true, text: 'Date' }
              }
            },
            plugins: {
              legend: { display: true },
              tooltip: { mode: 'index', intersect: false }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    } else {
      console.log('No moods data, showing placeholder');
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['No Data'],
          datasets: [{
            label: 'Average Mood',
            data: [0],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              title: { display: true, text: 'Mood (1-10)' }
            },
            x: {
              title: { display: true, text: 'Date' }
            }
          },
          plugins: {
            legend: { display: true },
            tooltip: { mode: 'index', intersect: false }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (canvasRef.current) {
        clearInterval(timer);
        initializeChart();
      }
    }, 100); // Check every 100ms until ref is available

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, [moods]);

  const handleLogHabit = async (habitType: string) => {
    if (!user?.id) return;

    try {
      const habit = habits.find(h => h.habit_type === habitType);
      const now = new Date().toISOString();
      const today = new Date().toDateString();
      
      const isNewDay = !habit || new Date(habit.last_done_at).toDateString() !== today;
      const streakUpdate = habit && !isNewDay ? habit.streak : (habit?.streak || 0) + 1;

      if (habit) {
        const { data, error } = await supabase
          .from('habits')
          .update({ streak: streakUpdate, last_done_at: now })
          .eq('user_id', user.id)
          .eq('habit_type', habitType)
          .select()
          .single();
        
        if (error) throw error;
        setHabits(habits.map(h => h.habit_type === habitType ? data : h));
      } else {
        const { data, error } = await supabase
          .from('habits')
          .insert({ user_id: user.id, habit_type: habitType, streak: streakUpdate, last_done_at: now })
          .select()
          .single();
        
        if (error) throw error;
        setHabits([...habits, data]);
      }
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user?.id || habitId.startsWith('default-')) {
      alert('Cannot delete default habits');
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;
      setHabits(habits.filter(h => h.id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleUpdateStreak = async (habitId: string, newStreak: number) => {
    if (!user?.id || newStreak < 0) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .update({ streak: newStreak })
        .eq('id', habitId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setHabits(habits.map(h => h.id === habitId ? data : h));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const handleAddCustomHabit = async (habitType: string) => {
    if (!user?.id || !habitType.trim()) return;

    const cleanHabitType = habitType.toLowerCase().trim();
    
    if (habits.find(h => h.habit_type === cleanHabitType)) {
      alert('This habit already exists!');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({ 
          user_id: user.id, 
          habit_type: cleanHabitType, 
          streak: 0, 
          last_done_at: new Date().toISOString() 
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding custom habit:', error.message || error);
        throw error;
      }
      setHabits([...habits, data]);
    } catch (error) {
      console.error('Error adding custom habit:', error);
    }
  };

  const calculateSleepFocusTrend = () => {
    if (sleepData.length === 0) return 'No Data';
    
    const avgQuality = sleepData.reduce((sum, log) => sum + (log.quality || 0), 0) / sleepData.length;
    const qualityPercentage = ((avgQuality / 10) * 100).toFixed(0);
    
    return `${qualityPercentage}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg mb-6 animate-pulse">
            <Heart className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <p className="text-gray-800 text-xl font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const moodBalance = moods.length > 0 ? ((moods.filter(m => m.mood >= 5).length / moods.length) * 100).toFixed(1) + '%' : 'N/A';
  const goalCompletionRate = goals.length > 0 ? ((goals.filter(g => g.completed).length / goals.length) * 100).toFixed(1) + '%' : '0%';
  const sleepFocusTrend = calculateSleepFocusTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            className="text-teal-600 border-teal-200 hover:bg-teal-50 bg-white/80 backdrop-blur-sm shadow-sm"
            onClick={() => (window.location.href = '/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 text-center drop-shadow-md">
          {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {user?.name || 'User'}!
        </h1>
      </div>

      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="h-24 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Flame className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <Flame className="h-6 w-6 mr-2 text-teal-600" /> Habit Streaks
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHabitManager(!showHabitManager)}
                className="text-teal-600 border-teal-300 hover:bg-teal-50"
              >
                {showHabitManager ? 'Hide' : 'Manage'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {showHabitManager && (
              <div className="mb-6 p-4 bg-teal-50/50 rounded-lg border border-teal-200">
                <h4 className="font-semibold text-gray-800 mb-3">Manage Habits</h4>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter new habit name"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-teal-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newHabitName.trim()) {
                        handleAddCustomHabit(newHabitName);
                        setNewHabitName('');
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newHabitName.trim()) {
                        handleAddCustomHabit(newHabitName);
                        setNewHabitName('');
                      }
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Add
                  </Button>
                </div>
                {editingStreak && (
                  <div className="flex gap-2 mb-4 p-2 bg-white rounded border">
                    <span className="text-sm text-gray-600 flex-1">Edit streak:</span>
                    <input
                      type="number"
                      min="0"
                      value={editingStreak.streak}
                      onChange={(e) => setEditingStreak({ ...editingStreak, streak: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        handleUpdateStreak(editingStreak.habitId, editingStreak.streak);
                        setEditingStreak(null);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingStreak(null)}
                      className="text-gray-600 text-xs px-2 py-1"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
            {habits.length > 0 ? habits.map((habit) => {
              const now = new Date();
              const isStreakActive = habit.last_done_at ? new Date(habit.last_done_at).toDateString() === now.toDateString() : false;
              return (
                <div key={habit.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-gray-800 mb-1 font-medium capitalize">{habit.habit_type}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          Streak: <span className="font-bold text-teal-600">{habit.streak} days</span>
                        </p>
                        {showHabitManager && habit.id.startsWith('default-') && (
                          <span className="text-xs text-gray-500 italic">(default)</span>
                        )}
                        {showHabitManager && !habit.id.startsWith('default-') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStreak({ habitId: habit.id, streak: habit.streak })}
                            className="text-xs px-2 py-1 h-6 text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Last Done: {habit.last_done_at ? new Date(habit.last_done_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        className={`bg-teal-600 hover:bg-teal-700 text-white font-medium py-1 px-3 rounded-lg transition-colors text-sm ${isStreakActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !isStreakActive && handleLogHabit(habit.habit_type)}
                        disabled={isStreakActive}
                      >
                        {isStreakActive ? 'Done Today' : 'Mark Done'}
                      </Button>
                      {showHabitManager && !habit.id.startsWith('default-') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-xs py-1 px-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">No habits yet</p>
                <Button
                  onClick={() => setShowHabitManager(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm"
                >
                  Add Your First Habit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-400 via-teal-500 to-green-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Brain className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Smile className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Smile className="h-6 w-6 mr-2 text-teal-600" /> Weekly Mood
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-48" style={{ minHeight: '192px' }}>
              <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: '192px', minWidth: '100%' }}></canvas>
            </div>
            {moods.length === 0 && (
              <p className="text-gray-600 text-center mt-2">No mood data available yet. Start tracking your mood!</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <TrendingUp className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600">Mood Balance</p>
              <p className="text-xl font-bold text-teal-600">{moodBalance}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Goal Completion</p>
              <p className="text-xl font-bold text-teal-600">{goalCompletionRate}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Sleep Quality</p>
              <p className="text-xl font-bold text-teal-600">{sleepFocusTrend}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Heart className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <BookOpen className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-6 w-6 mr-2 text-teal-600" /> Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {journalEntries.length > 0 ? (
              <div>
                <p className="text-gray-800 mb-2">Recent Entry: <strong>{journalEntries[0].title || 'Untitled'}</strong></p>
                <p className="text-sm text-gray-600">Content: {journalEntries[0].content.slice(0, 50) + (journalEntries[0].content.length > 50 ? '...' : '')}</p>
                <p className="text-sm text-gray-600">Mood: {journalEntries[0].mood_rating || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-gray-800">No entries yet</p>
            )}
            <Button
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-lg transition-colors"
              onClick={() => window.location.href = '/journal'}
            >
              Write Entry
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-green-400 via-teal-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Target className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="h-6 w-6 mr-2 text-teal-600" /> Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-800 mb-4">Completion Rate: {goalCompletionRate}</p>
            <ul className="text-gray-800 space-y-2">
              {goals.slice(0, 3).map((goal) => (
                <li key={goal.id} className={goal.completed ? 'line-through text-gray-500' : ''}>
                  {goal.title} ({goal.progress}%) {goal.completed && <span className="text-green-600 text-xs">✓</span>}
                </li>
              ))}
            </ul>
            {goals.length > 3 && <p className="text-sm text-gray-600 mt-2">+ {goals.length - 3} more...</p>}
            <Button
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-lg transition-colors"
              onClick={() => window.location.href = '/setgoals'}
            >
              Set Goal
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Moon className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Calendar className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Moon className="h-6 w-6 mr-2 text-teal-600" /> Sleep/Mood Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Recent Sleep Quality</p>
              <p className="text-lg font-bold text-teal-600">{sleepFocusTrend}</p>
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 rounded-lg transition-colors"
              onClick={() => (window.location.href = '/calendar')}
            >
              View Calendar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-1 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-2 right-2 opacity-80">
              <Heart className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <Activity className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardHeader className="bg-teal-50/50 border-b border-teal-200/30 -mt-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-teal-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="text-gray-800 space-y-2">
              {moods.slice(0, 3).map((mood) => (
                <li key={mood.id} className="flex justify-between items-center">
                  <span>Mood: {moodOptions.find(m => m.value === mood.mood)?.name || 'Unknown'} (Intensity: {mood.intensity})</span>
                  <span className="text-sm text-gray-500">{new Date(mood.created_at).toLocaleDateString()}</span>
                </li>
              ))}
              {journalEntries.slice(0, 3).map((entry) => (
                <li key={entry.id} className="flex justify-between items-center">
                  <span>Journal: {entry.title || 'Untitled'}</span>
                  <span className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                </li>
              ))}
              {activities.slice(0, 3).map((activity) => (
                <li key={activity.id} className="flex justify-between items-center">
                  <span>{activity.title}</span>
                  <span className="text-sm text-gray-500">{new Date(activity.created_at).toLocaleDateString()}</span>
                </li>
              ))}
              {sleepData.slice(0, 3).map((sleep) => (
                <li key={sleep.id} className="flex justify-between items-center">
                  <span>Sleep: {sleep.duration} hrs, Quality {sleep.quality}/10</span>
                  <span className="text-sm text-gray-500">{new Date(sleep.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
            {(moods.length === 0 && journalEntries.length === 0 && activities.length === 0 && sleepData.length === 0) && <p className="text-gray-800">No recent activity</p>}
          </CardContent>
        </Card>
      </div>
      <div className="max-w-7xl mx-auto mt-10 text-center">
        <p className="text-gray-800 text-lg font-medium italic bg-white/80 p-4 rounded-lg shadow-md">
          Daily Tip: Try a 5-minute meditation to calm your mind! 🌿
        </p>
      </div>
    </div>
  );
}