'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Mail, Sparkles, Star, ArrowRight, Shield, Smile, Brain, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase-client'; // Named import
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleMagicLink = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!email) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Redirect to callback route which will then redirect to homepage
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Magic link error:', error);
        setMessage('Error sending magic link: ' + error.message);
      } else {
        setEmailSent(true);
        setMessage('Check your email for the secure login link! 📧');
        console.log('Magic link sent successfully to:', email);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMagicLink(); // Call without event parameter
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setMessage('');
    setEmail('');
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4">
        {/* Modern Background Pattern */}
        <div className="fixed inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 via-transparent to-cyan-100/30"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        </div>

        {/* Success Card */}
        <Card className="bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Mail className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Email Sent Successfully!
            </h2>
            
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                We&apos;ve sent a secure login link to your email address.
              </p>
            
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
              <p className="text-teal-800 font-medium text-sm">
                Email sent to: <span className="font-bold">{email}</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 font-medium text-sm leading-relaxed">
                Can&apos;t find the email? Check your spam folder. The login link will redirect you to your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleTryAgain}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl"
              >
                Send Another Link
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100/30 via-transparent to-cyan-100/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10">
        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Left Side - Welcome Content */}
          <div className="flex items-center justify-center p-8 lg:p-16">
            <div className="max-w-lg">
              {/* Logo */}
              <div className="flex items-center space-x-4 mb-12">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  MoodScape
                </span>
              </div>

              <div className="space-y-8">
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                    Welcome Back to Your
                    <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Wellness Journey
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Continue your path to better mental health with personalized insights and evidence-based tools.
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-4">
                  {[
                    { icon: Brain, text: "AI-powered insights tailored to you" },
                    { icon: Shield, text: "Your data is secure and private" },
                    { icon: Target, text: "Track progress towards your goals" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6">
                  <div className="flex space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-3">
                  MoodScape has transformed how I approach my mental health. The insights are incredibly valuable.
                  </p>
                  <p className="text-sm text-gray-500 font-medium">- Sarah M., User since 2024</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center p-8 lg:p-16 bg-white/30 backdrop-blur-sm">
            <div className="max-w-md w-full">
              <Card className="bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-6">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      <span className="text-teal-800 text-sm font-medium">
                        Secure Magic Link Login
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Sign In to Your Account
                    </h2>
                    <p className="text-gray-600">
                      Enter your email to receive a secure login link
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/80 text-gray-900 placeholder-gray-500"
                          onKeyPress={handleKeyPress}
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleMagicLink}
                      disabled={isLoading || !email}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Sending Login Link...
                        </>
                      ) : (
                        <>
                          Send Magic Link
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    
                    {message && (
                      <div className={`text-center font-medium p-4 rounded-xl border ${
                        message.includes('Error') 
                          ? 'text-red-700 bg-red-50 border-red-200' 
                          : 'text-green-700 bg-green-50 border-green-200'
                      }`}>
                        {message}
                      </div>
                    )}
                  </div>

                  {/* Security Note */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-700 text-sm font-medium mb-1">
                            Secure & Private
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            We will send you a secure login link. No passwords needed, and we never spam.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Features Preview */}
                  <div className="mt-6">
                    <p className="text-center text-gray-600 text-sm mb-4 font-medium">
                      What is waiting for you:
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Smile, label: "Mood Tracking", color: "from-green-500 to-emerald-600" },
                        { icon: Brain, label: "AI Insights", color: "from-teal-500 to-cyan-600" },
                        { icon: Target, label: "Goal Setting", color: "from-emerald-500 to-teal-600" }
                      ].map((feature, index) => (
                        <div key={index} className="text-center">
                          <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md`}>
                            <feature.icon className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            {feature.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}