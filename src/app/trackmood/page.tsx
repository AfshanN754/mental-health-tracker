'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Smile, User, LogOut, ArrowLeft, Sparkles, TrendingUp, Calendar, Activity, Zap, Brain } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Chart from 'chart.js/auto';

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

const moodOptions = [
  { name: 'Happy', value: 8, emoji: '😊', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { name: 'Calm', value: 7, emoji: '😌', color: 'from-blue-400 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { name: 'Neutral', value: 5, emoji: '😐', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  { name: 'Anxious', value: 3, emoji: '😟', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { name: 'Sad', value: 2, emoji: '😢', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { name: 'Panic', value: 1, emoji: '😰', color: 'from-red-500 to-pink-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { name: 'Worried', value: 2, emoji: '😣', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
];

export default function TrackMood() {
  const [selectedMood, setSelectedMood] = useState('');
  const [moodIntensity, setMoodIntensity] = useState([5]);
  const [moodCause, setMoodCause] = useState('');
  const [moodNotes, setMoodNotes] = useState('');
  const [moods, setMoods] = useState<Mood[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) return;
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(7);
      if (error) console.error(error);
      else setMoods(data || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !selectedMood) {
      console.error('User not authenticated or no mood selected');
      return;
    }

    setIsSubmitting(true);
    const moodValue = moodOptions.find(m => m.name === selectedMood)?.value || 5;
    console.log('Submitting moodValue:', moodValue, 'type:', typeof moodValue);

    if (moodValue < 1 || moodValue > 10 || !Number.isInteger(moodValue)) {
      console.error('Invalid mood value:', moodValue);
      setIsSubmitting(false);
      return;
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('moods')
      .insert({
        user_id: userId,
        mood: Number(moodValue),
        intensity: moodIntensity[0],
        cause: moodCause || null,
        notes: moodNotes || null,
        created_at: now,
      });
    
    if (error) {
      console.error('Error saving mood:', error);
      if (error.code === '23514') {
        console.error('Constraint violation details:', error.message);
      }
    } else {
      const { data } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setMoods([data, ...moods.slice(0, 6)]);
      
      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (canvasRef.current && moods.length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: moods.map((m, i) => `Day ${i + 1}`),
            datasets: [{
              label: 'Mood Intensity',
              data: moods.map(m => m.intensity),
              backgroundColor: 'rgba(20, 184, 166, 0.8)',
            }],
          },
          options: { scales: { y: { beginAtZero: true, max: 10 } } },
        });
      }
    }
  }, [moods]);

  const handleMoodSelect = (moodName: string) => {
    setSelectedMood(moodName);
    const mood = moodOptions.find((m) => m.name === moodName);
    if (mood) setMoodIntensity([mood.value]);
  };

  const selectedMoodData = moodOptions.find(m => m.name === selectedMood);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-100/30 to-cyan-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-yellow-100/20 to-orange-100/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-teal-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center transform animate-in zoom-in-50 duration-500">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Mood Logged! 🎉</h3>
            <p className="text-gray-600 text-lg">Great job taking care of your mental wellness!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">MoodScape</h1>
                <p className="text-sm text-gray-600 font-medium">Track Your Journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                className="text-teal-600 border-teal-200 hover:bg-teal-50 rounded-xl px-6 py-3 font-semibold transform hover:scale-105 transition-all duration-200"
                onClick={() => window.location.href = '/'}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Homepage
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-teal-600 border-teal-200 hover:bg-teal-50 rounded-xl px-6 py-3 font-semibold transform hover:scale-105 transition-all duration-200"
              >
                <User className="w-5 h-5 mr-2" />
                Profile Setup
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-6 py-3 font-semibold transform hover:scale-105 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title with Animated Elements */}
          <div className="text-center mb-16 relative">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-full px-6 py-3 mb-6">
              <Brain className="h-6 w-6 text-teal-600 animate-pulse" />
              <span className="text-teal-800 font-semibold">Daily Wellness Check-in</span>
            </div>
            
            <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Track Your <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Daily Mood</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Monitor your emotional well-being with our intuitive mood tracking system. 
              Understanding your patterns is the first step toward better mental health.
            </p>
            
            {/* Floating Stats Cards */}
            <div className="flex justify-center space-x-8 mt-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{moods.length}</p>
                    <p className="text-gray-600 text-sm font-medium">Days Tracked</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {moods.length > 0 ? Math.round(moods.reduce((acc, mood) => acc + mood.intensity, 0) / moods.length) : 0}
                    </p>
                    <p className="text-gray-600 text-sm font-medium">Avg. Intensity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Mood Tracking Card */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden transform hover:scale-102 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-cyan-50/50"></div>
            
            <CardHeader className="relative text-center pb-8 pt-12">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Activity className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold text-gray-900 mb-4">How are you feeling today?</CardTitle>
              <p className="text-gray-600 text-lg font-medium">Select your current mood and tell us more about it</p>
            </CardHeader>

            <CardContent className="relative px-12 pb-12">
              <div className="space-y-12">
                {/* Enhanced Mood Selection Grid */}
                <div>
                  <Label className="text-xl font-bold text-gray-800 mb-8 block flex items-center">
                    <Smile className="h-6 w-6 mr-3 text-teal-600" />
                    Choose your mood
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {moodOptions.map((mood) => (
                      <Button
                        key={mood.name}
                        variant="outline"
                        onClick={() => handleMoodSelect(mood.name)}
                        className={`h-20 relative overflow-hidden transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                          selectedMood === mood.name 
                            ? `bg-gradient-to-r ${mood.color} text-white border-0 shadow-2xl scale-105 -translate-y-1` 
                            : `bg-white/80 ${mood.borderColor} text-gray-700 hover:${mood.bgColor} hover:border-teal-300 shadow-lg`
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="font-semibold text-sm">{mood.name}</span>
                        </div>
                        {selectedMood === mood.name && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedMood && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Enhanced Intensity Slider */}
                    <div className={`${selectedMoodData?.bgColor} p-8 rounded-3xl border-2 ${selectedMoodData?.borderColor} shadow-inner relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 text-6xl opacity-10">
                        {selectedMoodData?.emoji}
                      </div>
                      <Label className="text-xl font-bold text-gray-800 mb-6 block flex items-center">
                        <Zap className="h-6 w-6 mr-3 text-teal-600" />
                        Intensity Level: 
                        <span className={`ml-3 text-2xl font-bold bg-gradient-to-r ${selectedMoodData?.color} bg-clip-text text-transparent`}>
                          {moodIntensity[0]}/10
                        </span>
                      </Label>
                      <div className="relative">
                        <Slider 
                          value={moodIntensity} 
                          onValueChange={setMoodIntensity} 
                          max={10} 
                          min={1} 
                          step={1}
                          className="w-full h-3"
                        />
                        <div className="flex justify-between text-sm font-semibold text-gray-600 mt-4">
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                            Low
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                            Moderate
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                            High
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Cause Selection */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-3xl border-2 border-gray-200 shadow-lg">
                      <Label className="text-xl font-bold text-gray-800 mb-6 block flex items-center">
                        <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                        What triggered this mood?
                      </Label>
                      <Select value={moodCause} onValueChange={setMoodCause}>
                        <SelectTrigger className="h-16 border-2 border-gray-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-200 rounded-2xl text-lg font-medium bg-white/90">
                          <SelectValue placeholder="Select what influenced your mood today..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-2 border-gray-200">
                          <SelectItem value="work" className="text-lg py-3">💼 Work</SelectItem>
                          <SelectItem value="family" className="text-lg py-3">👨‍👩‍👧‍👦 Family</SelectItem>
                          <SelectItem value="studies" className="text-lg py-3">📚 Studies</SelectItem>
                          <SelectItem value="relationship" className="text-lg py-3">💕 Relationship</SelectItem>
                          <SelectItem value="health" className="text-lg py-3">🏥 Health</SelectItem>
                          <SelectItem value="social" className="text-lg py-3">🎉 Social Events</SelectItem>
                          <SelectItem value="weather" className="text-lg py-3">🌤️ Weather</SelectItem>
                          <SelectItem value="other" className="text-lg py-3">🤔 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Enhanced Notes Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-3xl border-2 border-purple-200 shadow-lg">
                      <Label className="text-xl font-bold text-gray-800 mb-6 block flex items-center">
                        <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                        Additional thoughts (optional)
                      </Label>
                      <Textarea 
                        value={moodNotes} 
                        onChange={(e) => setMoodNotes(e.target.value)} 
                        placeholder="Share any additional details about your mood, what happened today, or how you're feeling... 💭"
                        className="min-h-[120px] border-2 border-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-200 resize-none rounded-2xl text-lg bg-white/90 font-medium"
                      />
                    </div>

                    {/* Enhanced Submit Button */}
                    <div className="pt-6">
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="w-full h-16 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl relative overflow-hidden"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Saving Your Mood...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Heart className="h-6 w-6" />
                            <span>Log My Mood Entry</span>
                            <Sparkles className="h-6 w-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Chart Section */}
              {moods.length > 0 && (
                <div className="mt-16 bg-white/80 p-8 rounded-3xl shadow-xl border-2 border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <TrendingUp className="h-7 w-7 mr-3 text-teal-600" />
                    Your Mood Journey
                  </h3>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl">
                    <canvas ref={canvasRef} width="400" height="200" className="w-full"></canvas>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Motivational Footer */}
          {selectedMood && (
            <div className="text-center mt-12 relative animate-in slide-in-from-bottom-2 duration-700">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-3xl border-2 border-teal-200 shadow-xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 text-8xl opacity-5">🌟</div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-teal-800 font-bold text-xl leading-relaxed">
                    🌟 Great job taking care of your mental wellness! Every mood entry helps you understand yourself better.
                  </p>
                  <div className="flex justify-center space-x-2 mt-4">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}