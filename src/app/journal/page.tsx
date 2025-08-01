'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Heart, 
  User, 
  LogOut, 
  ArrowLeft,
  Type,
  Palette,
  Highlighter,
  Smile,
  Star,
  Sparkles,
  Save,
  Download,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client'; // Updated import

const fontFamilies = [
  { name: 'Default', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Mono', value: 'font-mono' },
  { name: 'Handwriting', value: 'font-cursive' },
];

const textColors = [
  { name: 'Black', value: 'text-gray-900', bg: 'bg-gray-900' },
  { name: 'Blue', value: 'text-blue-600', bg: 'bg-blue-600' },
  { name: 'Green', value: 'text-green-600', bg: 'bg-green-600' },
  { name: 'Purple', value: 'text-purple-600', bg: 'bg-purple-600' },
  { name: 'Pink', value: 'text-pink-600', bg: 'bg-pink-600' },
  { name: 'Teal', value: 'text-teal-600', bg: 'bg-teal-600' },
  { name: 'Orange', value: 'text-orange-600', bg: 'bg-orange-600' },
  { name: 'Red', value: 'text-red-600', bg: 'bg-red-600' },
];

const highlightColors = [
  { name: 'Yellow', value: 'bg-yellow-200', preview: 'bg-yellow-200' },
  { name: 'Green', value: 'bg-green-200', preview: 'bg-green-200' },
  { name: 'Blue', value: 'bg-blue-200', preview: 'bg-blue-200' },
  { name: 'Pink', value: 'bg-pink-200', preview: 'bg-pink-200' },
  { name: 'Purple', value: 'bg-purple-200', preview: 'bg-purple-200' },
];

const stickers = [
  { emoji: '😊', name: 'Happy' },
  { emoji: '💖', name: 'Love' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '🌟', name: 'Sparkle' },
  { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🦋', name: 'Butterfly' },
  { emoji: '🌸', name: 'Flower' },
  { emoji: '☀️', name: 'Sun' },
  { emoji: '🌙', name: 'Moon' },
  { emoji: '✨', name: 'Magic' },
  { emoji: '🎵', name: 'Music' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '📚', name: 'Books' },
  { emoji: '🎨', name: 'Art' },
  { emoji: '🏃‍♀️', name: 'Exercise' },
  { emoji: '🧘‍♀️', name: 'Meditation' },
];

const moodOptions = [
  { label: 'Happy', value: 8 },
  { label: 'Sad', value: 3 },
  { label: 'Anxious', value: 4 },
  { label: 'Angry', value: 2 },
  { label: 'Calm', value: 6 },
];

export default function Journal() {
  const router = useRouter();

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');

  const [entry, setEntry] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [textSize, setTextSize] = useState([16]);
  const [textColor, setTextColor] = useState('text-gray-900');
  const [highlightColor, setHighlightColor] = useState('');
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [dailyPrompt, setDailyPrompt] = useState('What made you smile today?');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const prompts = [
      'What made you smile today?',
      'What are you grateful for today?',
      'How did you handle a challenge today?',
      'What would you like to improve about today?',
      'Describe a moment that brought you peace today.',
      'What inspired you today?',
      'How did you show kindness today?',
      'What challenged you to grow today?',
    ];
    setDailyPrompt(prompts[Math.floor(Math.random() * prompts.length)]);

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
          <p className="text-white text-xl font-medium animate-bounce">Loading your magical journal...</p>
          <div className="flex space-x-1 justify-center mt-4">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!entry.trim()) {
      setError('Please write something in your journal first!');
      return;
    }
    
    if (!userId) {
      setError('User not authenticated. Please log in again.');
      router.replace('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const insertData = {
        user_id: userId,
        title: journalTitle.trim() || 'Untitled Entry',
        content: entry.trim(),
        mood_rating: selectedMood,
        tags: tags.length > 0 ? tags : null,
        created_at: new Date().toISOString(),
      };

      console.log('Saving journal entry:', insertData);

      const { data, error: insertError } = await supabase
        .from('journals')
        .insert([insertData])
        .select('*');
      console.log('Inserting into table:', 'journals');

      if (insertError) {
        console.error('Supabase insertion error:', insertError);
        if (insertError.message.includes('relation') && insertError.message.includes('does not exist')) {
          setError('Database table "journals" not found. Please check your database setup.');
        } else if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          setError(`Database column error: ${insertError.message}. Please check your table structure.`);
        } else if (insertError.code === '23505') {
          setError('A journal entry with this information already exists.');
        } else {
          setError(`Failed to save journal entry: ${insertError.message}`);
        }
      } else {
        console.log('Successfully saved journal entry:', data);
        setError(null);
        alert('Journal entry saved successfully! 🎉');
        setEntry('');
        setJournalTitle('');
        setSelectedMood(null);
        setTags([]);
        setMediaUrl(null);
        setIsLocked(false);
        setPin('');
      }
    } catch (err) {
      console.error('Unexpected error in handleSave:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSticker = (emoji: string) => setEntry(entry + ' ' + emoji + ' ');
  const addTag = (tag: string) => !tags.includes(tag) && setTags([...tags, tag]);
  const removeTag = (tagToRemove: string) => setTags(tags.filter(tag => tag !== tagToRemove));
  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getTextSizeClass = () => {
    const size = textSize[0];
    return size <= 12 ? 'text-xs' : size <= 14 ? 'text-sm' : size <= 16 ? 'text-base' : size <= 18 ? 'text-lg' : size <= 20 ? 'text-xl' : size <= 24 ? 'text-2xl' : 'text-3xl';
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

  const clearForm = () => {
    setEntry('');
    setJournalTitle('');
    setSelectedMood(null);
    setTags([]);
    setIsLocked(false);
    setPin('');
    setError(null);
  };

  const handleExport = () => {
    if (!entry.trim()) {
      setError('No content to export!');
      return;
    }
    const exportContent = `
# ${journalTitle || 'Journal Entry'}

**Date:** ${getCurrentDate()}
**Mood:** ${selectedMood ? moodOptions.find(m => m.value === selectedMood)?.label : 'Not specified'}
**Tags:** ${tags.length > 0 ? tags.join(', ') : 'None'}

---

${entry}

---
*Exported from MoodScape Journal*
    `.trim();
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-entry-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-300/30 to-blue-300/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl animate-float-slow"></div>
        
        {/* Floating icons */}
        <div className="absolute top-20 left-20 text-purple-300/40 animate-bounce-slow">
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-32 text-pink-300/40 animate-bounce-delayed">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-1/3 text-teal-300/40 animate-bounce-slow">
          <Star className="w-7 h-7" />
        </div>
      </div>

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

      {/* Glassmorphism header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/30 px-6 py-5 shadow-lg relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-r from-teal-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Heart className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">MoodScape</h1>
              <p className="text-sm text-gray-500 font-medium">Your Personal Journal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="text-teal-600 border-teal-200/50 hover:bg-teal-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Homepage
            </Button>
            <Button variant="outline" size="sm" className="text-purple-600 border-purple-200/50 hover:bg-purple-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => router.push('/profilesetup')}>
              <User className="w-4 h-4 mr-2" /> Profile
            </Button>
            <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 shadow-lg">
              <span className="text-sm text-gray-700 font-medium">Hello, <span className="text-teal-600 font-semibold">{userName}</span>! ✨</span>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all duration-300 hover:scale-105" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero section with animated elements */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-pink-300/20 blur-3xl rounded-full"></div>
            <div className="relative z-10 bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
              <h2 className="text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent animate-gradient">
                  Your Magical Journal
                </span>
              </h2>
              <div className="bg-gradient-to-r from-teal-100/80 to-purple-100/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <p className="text-lg text-gray-700 font-medium">
                  ✨ Today&apos;s inspiration: <span className="text-purple-600 font-semibold italic">&quot;{dailyPrompt}&quot;</span>
                </p>
                <div className="flex justify-center mt-4 space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping delay-100"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping delay-200"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar with glassmorphism */}
            <div className="lg:col-span-1">
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl sticky top-6 border border-white/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-pink-100/30"></div>
                <CardHeader className="relative z-10 bg-gradient-to-r from-purple-50/80 to-pink-50/80 border-b border-white/30">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-3 shadow-lg">
                      <Palette className="w-4 h-4 text-white" />
                    </div>
                    Creative Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-6 relative z-10">
                  {/* Font Style */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Type className="w-4 h-4 mr-2 text-purple-500" /> Font Magic
                    </label>
                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 transition-all duration-300 shadow-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
                        {fontFamilies.map(font => 
                          <SelectItem key={font.value} value={font.value} className="hover:bg-purple-50/80">{font.name}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Size */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      ✨ Text Size: <span className="text-purple-600 font-bold">{textSize[0]}px</span>
                    </label>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-lg">
                      <Slider value={textSize} onValueChange={setTextSize} min={12} max={28} step={2} className="w-full" />
                    </div>
                  </div>

                  {/* Text Colors */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">🎨 Text Colors</label>
                    <div className="grid grid-cols-4 gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg">
                      {textColors.map(color => 
                        <button 
                          key={color.value} 
                          onClick={() => setTextColor(color.value)} 
                          className={`w-10 h-10 rounded-full ${color.bg} border-2 transition-all duration-300 hover:scale-125 ${textColor === color.value ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300 hover:shadow-md'}`} 
                          title={color.name} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Highlighter */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Highlighter className="w-4 h-4 mr-2 text-yellow-500" /> Highlighter Magic
                    </label>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg">
                      {highlightColors.map(color => 
                        <button 
                          key={color.value} 
                          onClick={() => { setHighlightColor(color.value); setIsHighlighting(true); }} 
                          className={`w-10 h-10 rounded-lg ${color.preview} border-2 transition-all duration-300 hover:scale-125 ${highlightColor === color.value ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300 hover:shadow-md'}`} 
                          title={color.name} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Stickers & Emojis */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Smile className="w-4 h-4 mr-2 text-pink-500" /> Fun Stickers
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg custom-scrollbar">
                      {stickers.map(sticker => 
                        <button 
                          key={sticker.name} 
                          onClick={() => addSticker(sticker.emoji)} 
                          className="text-2xl hover:bg-white/80 p-2 rounded-lg transition-all duration-300 hover:scale-125 hover:shadow-lg active:scale-95" 
                          title={sticker.name}
                        >
                          {sticker.emoji}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mood Selector */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mr-2"></div> 
                      Current Mood
                    </label>
                    <Select value={selectedMood?.toString() || ''} onValueChange={(value) => setSelectedMood(parseInt(value))}>
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 transition-all duration-300 shadow-lg">
                        <SelectValue placeholder="How are you feeling? ✨" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
                        {moodOptions.map(mood => 
                          <SelectItem key={mood.value} value={mood.value.toString()} className="hover:bg-purple-50/80">{mood.label}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-teal-500" /> Quick Tags
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg">
                        {['stress', 'gratitude', 'reflection', 'happy', 'sad', 'work', 'family', 'health'].map(tag => 
                          <Button 
                            key={tag} 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addTag(tag)} 
                            className="text-xs text-teal-600 border-teal-200/50 hover:bg-teal-50/80 backdrop-blur-sm bg-white/40 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105" 
                            disabled={tags.includes(tag)}
                          >
                            #{tag}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => 
                          <span 
                            key={tag} 
                            className="bg-gradient-to-r from-teal-100 to-purple-100 text-teal-800 text-xs px-3 py-2 rounded-full flex items-center shadow-lg border border-white/30 backdrop-blur-sm animate-slide-in"
                          >
                            <span>#{tag}</span>
                            <button 
                              onClick={() => removeTag(tag)} 
                              className="ml-2 text-teal-600 hover:text-teal-800 hover:scale-110 transition-all duration-200"
                            >
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lock Entry */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <EyeOff className="w-4 h-4 mr-2 text-purple-500" /> Privacy Lock
                    </label>
                    <div className="space-y-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          checked={isLocked} 
                          onChange={(e) => setIsLocked(e.target.checked)} 
                          className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded border-gray-300" 
                          id="lockEntry" 
                        />
                        <label htmlFor="lockEntry" className="text-sm text-gray-700 font-medium">🔒 Lock this entry</label>
                      </div>
                      {isLocked && (
                        <input 
                          type="password" 
                          placeholder="Set 4-digit PIN ✨" 
                          value={pin} 
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                          className="w-full p-3 border border-gray-300/50 rounded-lg text-sm focus:border-purple-300 focus:ring-purple-200 bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300" 
                          maxLength={4} 
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main writing area */}
            <div className="lg:col-span-3">
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl border border-white/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-purple-50/30"></div>
                
                <CardHeader className="border-b border-white/30 bg-gradient-to-r from-teal-50/80 to-purple-50/80 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-teal-400 to-purple-400 rounded-full mr-3 animate-pulse"></div>
                        {getCurrentDate()}
                      </CardTitle>
                      <input 
                        type="text" 
                        placeholder="✨ Give your thoughts a magical title..." 
                        value={journalTitle} 
                        onChange={(e) => setJournalTitle(e.target.value)} 
                        className="mt-2 text-xl font-semibold text-purple-600 bg-transparent border-none outline-none placeholder-gray-400 w-full focus:placeholder-purple-300 transition-all duration-300" 
                        maxLength={100} 
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowPreview(!showPreview)} 
                      className="border-purple-200/50 text-purple-600 hover:bg-purple-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showPreview ? '✏️ Edit' : '👁️ Preview'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-8 relative z-10">
                  {showPreview ? (
                    <div className="min-h-96 p-6 bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-inner">
                      {journalTitle && (
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-6 animate-fade-in">
                          {journalTitle}
                        </h3>
                      )}
                      <div className={`whitespace-pre-wrap ${selectedFont} ${getTextSizeClass()} ${textColor} leading-relaxed`}>
                        {entry.split('\n').map((line, index) => 
                          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            {line}
                            {index < entry.split('\n').length - 1 && <br />}
                          </div>
                        )}
                      </div>
                      
                      {/* Preview metadata */}
                      <div className="mt-8 space-y-4">
                        {selectedMood && (
                          <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm text-gray-600 mb-2 font-medium">Current Mood:</p>
                            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-pink-100 px-4 py-2 rounded-full border border-white/40 shadow-lg">
                              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-pulse"></div>
                              <span className="text-purple-600 font-semibold">{moodOptions.find(m => m.value === selectedMood)?.label}</span>
                            </div>
                          </div>
                        )}
                        
                        {tags.length > 0 && (
                          <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm text-gray-600 mb-3 font-medium">Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {tags.map(tag => 
                                <span 
                                  key={tag} 
                                  className="bg-gradient-to-r from-teal-100 to-purple-100 text-teal-800 text-sm px-3 py-2 rounded-full shadow-lg border border-white/30 animate-bounce-in"
                                >
                                  #{tag}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative">
                        <Textarea 
                          value={entry} 
                          onChange={(e) => setEntry(e.target.value)} 
                          placeholder={`✨ ${dailyPrompt}\n\n🎨 Let your creativity flow! Use the magical tools on the left to make your entry sparkle...\n\n💭 What's on your mind today?`}
                          className={`w-full h-96 resize-none border-white/40 focus:border-purple-300 focus:ring-purple-200 ${selectedFont} ${getTextSizeClass()} ${textColor} ${isHighlighting ? highlightColor : ''} bg-white/60 backdrop-blur-sm shadow-lg transition-all duration-300 placeholder-gray-400 focus:placeholder-purple-300`} 
                          style={{ fontSize: `${textSize[0]}px` }} 
                        />
                        <div className="absolute top-4 right-4 flex space-x-2 opacity-50">
                          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                          <Heart className="w-5 h-5 text-pink-400 animate-pulse delay-100" />
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-4 pt-6 border-t border-white/30">
                        <Button 
                          onClick={handleSave} 
                          disabled={isLoading || !entry.trim()} 
                          className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                        >
                          <Save className="mr-2 h-5 w-5" /> 
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving Magic...
                            </>
                          ) : (
                            '✨ Save Entry'
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="border-teal-200/50 text-teal-600 hover:bg-teal-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                          disabled={isLoading || !entry.trim()} 
                          onClick={handleExport}
                        >
                          <Download className="mr-2 h-4 w-4" /> 📄 Export
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={clearForm} 
                          className="border-gray-200/50 text-gray-600 hover:bg-gray-50/80 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                          disabled={isLoading}
                        >
                          🗑️ Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inspirational quote card */}
              <div className="mt-8 text-center p-8 bg-gradient-to-r from-purple-100/80 to-pink-100/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-pink-300/20 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                      <Sparkles className="w-8 h-8 text-purple-600 relative z-10 animate-bounce" />
                    </div>
                  </div>
                  <p className="text-purple-700 font-semibold text-lg italic mb-2">
                    &quot;The act of writing is the act of discovering what you believe.&quot;
                  </p>
                  <p className="text-purple-600 text-sm">- David Hare</p>
                  <div className="flex justify-center mt-4 space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping delay-100"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes slide-down {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes slide-in {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-bounce-delayed { animation: bounce-delayed 3s ease-in-out infinite 1s; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-slide-down { animation: slide-down 0.5s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </div>
  );
}