'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Moon, Heart, ChevronLeft, ChevronRight, Plus, Edit } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Chart from 'chart.js/auto';
import { cn } from '@/lib/utils';

// Define the Value type since it's not being imported correctly
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface SleepData {
  id: string;
  user_id: string;
  duration: number; // Hours
  quality: number; // 1-10
  created_at: string;
}

export default function CalendarPage() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedSleep, setSelectedSleep] = useState<SleepData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  
  // Sleep form states
  const [sleepDuration, setSleepDuration] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [sleepNotes, setSleepNotes] = useState('');
  
  // Mood form states
  const [selectedMoodValue, setSelectedMoodValue] = useState('');
  const [moodIntensity, setMoodIntensity] = useState('');
  const [moodCause, setMoodCause] = useState('');
  const [moodNotes, setMoodNotes] = useState('');
  
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) return;
      setUserId(session.user.id);

      // Fetch mood data
      const { data: moodData } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setMoods(moodData || []);

      // Fetch sleep data from your existing 'sleep' table
      const { data: sleepDataFromDB } = await supabase
        .from('sleep')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      setSleepData(sleepDataFromDB || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    if (sleepData.length === 0) return;
    
    const ctx = document.getElementById('sleepChart') as HTMLCanvasElement | null;
    if (ctx) {
      const sortedSleepData = [...sleepData].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).slice(-7); // Last 7 days

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedSleepData.map((s) => 
            new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ),
          datasets: [
            {
              label: 'Sleep Duration (hrs)',
              data: sortedSleepData.map((s) => s.duration),
              borderColor: '#14b8a6',
              backgroundColor: 'rgba(20, 184, 166, 0.2)',
              fill: true,
              yAxisID: 'y',
            },
            {
              label: 'Sleep Quality (1-10)',
              data: sortedSleepData.map((s) => s.quality),
              borderColor: '#9333ea',
              backgroundColor: 'rgba(147, 51, 234, 0.2)',
              fill: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              max: 12,
              title: {
                display: true,
                text: 'Hours'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              max: 10,
              title: {
                display: true,
                text: 'Quality (1-10)'
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });
    }
  }, [sleepData]);

  const moodOptions = [
    { name: 'Excellent', value: 10 },
    { name: 'Great', value: 9 },
    { name: 'Good', value: 8 },
    { name: 'Okay', value: 7 },
    { name: 'Fine', value: 6 },
    { name: 'Neutral', value: 5 },
    { name: 'Not Great', value: 4 },
    { name: 'Poor', value: 3 },
    { name: 'Bad', value: 2 },
    { name: 'Terrible', value: 1 },
  ];

  const getMoodForDate = (date: Date): Mood | null => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return moods.find((m) => {
      const mDate = new Date(m.created_at);
      mDate.setHours(0, 0, 0, 0);
      return mDate.getTime() === d.getTime();
    }) || null;
  };

  const getSleepForDate = (date: Date): SleepData | null => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return sleepData.find((s) => {
      const sDate = new Date(s.created_at);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === d.getTime();
    }) || null;
  };

  const handleDateChange = (value: Value) => {
    // Handle the case where value could be Date, Date[], or null
    let selectedDate: Date | null = null;
    
    if (value instanceof Date) {
      selectedDate = value;
    } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof Date) {
      selectedDate = value[0]; // Use the first date if range is selected
    }
    
    if (!selectedDate) return;
    
    setSelectedDate(selectedDate);
    setSelectedMood(getMoodForDate(selectedDate));
    setSelectedSleep(getSleepForDate(selectedDate));
    setShowSleepForm(false);
    setShowMoodForm(false);
  };

  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDate) return;

    const duration = parseFloat(sleepDuration);
    const quality = parseInt(sleepQuality);
    
    if (duration < 0 || duration > 24 || quality < 1 || quality > 10) {
      alert('Please enter valid values (Duration: 0-24 hours, Quality: 1-10)');
      return;
    }

    const existingSleep = getSleepForDate(selectedDate);
    
    try {
      if (existingSleep) {
        // Update existing sleep record
        const { error } = await supabase
          .from('sleep')
          .update({
            duration,
            quality,
          })
          .eq('id', existingSleep.id);
          
        if (error) throw error;
        
        // Update local state
        setSleepData(prev => prev.map(s => 
          s.id === existingSleep.id 
            ? { ...s, duration, quality }
            : s
        ));
      } else {
        // Create new sleep record
        const { data, error } = await supabase
          .from('sleep')
          .insert([{
            user_id: userId,
            duration,
            quality,
            created_at: selectedDate.toISOString(),
          }])
          .select();
          
        if (error) throw error;
        
        if (data) {
          setSleepData(prev => [...prev, ...data]);
        }
      }
      
      // Reset form
      setSleepDuration('');
      setSleepQuality('');
      setSleepNotes('');
      setShowSleepForm(false);
      setSelectedSleep(getSleepForDate(selectedDate));
    } catch (error) {
      console.error('Error saving sleep data:', error);
      alert('Failed to save sleep data. Please try again.');
    }
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDate) return;

    const mood = parseInt(selectedMoodValue);
    const intensity = parseInt(moodIntensity);
    
    if (mood < 1 || mood > 10 || intensity < 1 || intensity > 10) {
      alert('Please enter valid values (Mood & Intensity: 1-10)');
      return;
    }

    const existingMood = getMoodForDate(selectedDate);
    
    try {
      if (existingMood) {
        // Update existing mood record
        const { error } = await supabase
          .from('moods')
          .update({
            mood,
            intensity,
            cause: moodCause || null,
            notes: moodNotes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMood.id);
          
        if (error) throw error;
        
        // Update local state
        setMoods(prev => prev.map(m => 
          m.id === existingMood.id 
            ? { ...m, mood, intensity, cause: moodCause || null, notes: moodNotes || null, updated_at: new Date().toISOString() }
            : m
        ));
      } else {
        // Create new mood record
        const { data, error } = await supabase
          .from('moods')
          .insert([{
            user_id: userId,
            mood,
            intensity,
            cause: moodCause || null,
            notes: moodNotes || null,
            created_at: selectedDate.toISOString(),
          }])
          .select();
          
        if (error) throw error;
        
        if (data) {
          setMoods(prev => [...prev, ...data]);
        }
      }
      
      // Reset form
      setSelectedMoodValue('');
      setMoodIntensity('');
      setMoodCause('');
      setMoodNotes('');
      setShowMoodForm(false);
      setSelectedMood(getMoodForDate(selectedDate));
    } catch (error) {
      console.error('Error saving mood data:', error);
      alert('Failed to save mood data. Please try again.');
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const mood = getMoodForDate(date);
    const sleep = getSleepForDate(date);
    
    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
        {mood && (
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              mood.mood >= 7 ? 'bg-green-500' : 
              mood.mood >= 4 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            title={`Mood: ${moodOptions.find(m => m.value === mood.mood)?.name || 'Unknown'}`}
          />
        )}
        {sleep && (
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              sleep.quality >= 8 ? 'bg-blue-500' : 
              sleep.quality >= 6 ? 'bg-purple-500' : 'bg-orange-500'
            )}
            title={`Sleep: ${sleep.duration}h, Quality: ${sleep.quality}/10`}
          />
        )}
      </div>
    );
  };

  const averageSleepDuration = sleepData.length > 0 
    ? (sleepData.reduce((sum, s) => sum + s.duration, 0) / sleepData.length).toFixed(1)
    : '0';
    
  const averageSleepQuality = sleepData.length > 0 
    ? (sleepData.reduce((sum, s) => sum + s.quality, 0) / sleepData.length).toFixed(1)
    : '0';
        
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">MoodScape</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="text-teal-600 border-teal-200 hover:bg-teal-50"
              onClick={() => (window.location.href = '/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Your <span className="text-teal-500">Mood & Sleep Calendar</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
            Track your mood and sleep patterns over time. Select a date to add or view your data.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Section */}
            <Card className="shadow-lg border-0 bg-white lg:col-span-2">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-semibold text-gray-900">Interactive Calendar</CardTitle>
                <p className="text-sm text-gray-600">Green/Yellow/Red dots = Mood | Blue/Purple/Orange dots = Sleep</p>
              </CardHeader>
              <CardContent>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  tileContent={tileContent}
                  className="rounded-lg border shadow-sm w-full mx-auto"
                  prevLabel={<ChevronLeft className="h-6 w-6 text-teal-600" />}
                  nextLabel={<ChevronRight className="h-6 w-6 text-teal-600" />}
                />
                
                {selectedDate && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => {
                          setShowMoodForm(!showMoodForm);
                          setShowSleepForm(false);
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        {selectedMood ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {selectedMood ? 'Edit Mood' : 'Add Mood'}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setShowSleepForm(!showSleepForm);
                          setShowMoodForm(false);
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {selectedSleep ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {selectedSleep ? 'Edit Sleep' : 'Add Sleep'}
                      </Button>
                    </div>

                    {/* Mood Form */}
                    {showMoodForm && (
                      <Card className="bg-teal-50 border-teal-200">
                        <CardContent className="pt-6">
                          <form onSubmit={handleMoodSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="mood">Mood (1-10)</Label>
                              <select
                                id="mood"
                                value={selectedMoodValue}
                                onChange={(e) => setSelectedMoodValue(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md"
                                required
                              >
                                <option value="">Select mood...</option>
                                {moodOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.value} - {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <Label htmlFor="intensity">Intensity (1-10)</Label>
                              <Input
                                id="intensity"
                                type="number"
                                min="1"
                                max="10"
                                value={moodIntensity}
                                onChange={(e) => setMoodIntensity(e.target.value)}
                                placeholder="How intense was this mood?"
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="cause">Cause (optional)</Label>
                              <Input
                                id="cause"
                                value={moodCause}
                                onChange={(e) => setMoodCause(e.target.value)}
                                placeholder="What caused this mood?"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="moodNotes">Notes (optional)</Label>
                              <Textarea
                                id="moodNotes"
                                value={moodNotes}
                                onChange={(e) => setMoodNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                rows={2}
                              />
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
                                Save Mood
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowMoodForm(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Sleep Form */}
                    {showSleepForm && (
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="pt-6">
                          <form onSubmit={handleSleepSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="duration">Sleep Duration (hours)</Label>
                              <Input
                                id="duration"
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={sleepDuration}
                                onChange={(e) => setSleepDuration(e.target.value)}
                                placeholder="e.g., 7.5"
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="quality">Sleep Quality (1-10)</Label>
                              <Input
                                id="quality"
                                type="number"
                                min="1"
                                max="10"
                                value={sleepQuality}
                                onChange={(e) => setSleepQuality(e.target.value)}
                                placeholder="Rate your sleep quality"
                                required
                              />
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                                Save Sleep Data
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowSleepForm(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    {/* Display existing data */}
                    {(selectedMood || selectedSleep) && !showMoodForm && !showSleepForm && (
                      <div className="space-y-4">
                        {selectedMood && (
                          <Card className="bg-teal-50 border-teal-200">
                            <CardContent className="pt-4">
                              <h4 className="font-medium text-teal-700 mb-2">Mood Entry</h4>
                              <p className="text-sm text-gray-600">
                                <strong>Mood:</strong> {moodOptions.find(m => m.value === selectedMood.mood)?.name || 'Unknown'} ({selectedMood.mood}/10)
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Intensity:</strong> {selectedMood.intensity}/10
                              </p>
                              {selectedMood.cause && (
                                <p className="text-sm text-gray-600">
                                  <strong>Cause:</strong> {selectedMood.cause}
                                </p>
                              )}
                              {selectedMood.notes && (
                                <p className="text-sm text-gray-600">
                                  <strong>Notes:</strong> {selectedMood.notes}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                        
                        {selectedSleep && (
                          <Card className="bg-purple-50 border-purple-200">
                            <CardContent className="pt-4">
                              <h4 className="font-medium text-purple-700 mb-2">Sleep Entry</h4>
                              <p className="text-sm text-gray-600">
                                <strong>Duration:</strong> {selectedSleep.duration} hours
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Quality:</strong> {selectedSleep.quality}/10
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sleep Analysis Section */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center justify-center">
                  <Moon className="h-5 w-5 mr-2 text-purple-600" /> Sleep Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sleepData.length > 0 ? (
                  <>
                    <canvas id="sleepChart" width="400" height="300" className="w-full mb-4"></canvas>
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-gray-600">
                        <strong>Avg Duration:</strong> {averageSleepDuration} hrs
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Avg Quality:</strong> {averageSleepQuality}/10
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Showing last 7 entries
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Moon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No sleep data yet</p>
                    <p className="text-sm text-gray-400">Select a date and add your first sleep entry</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}