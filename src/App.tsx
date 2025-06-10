import React, { useState, useEffect } from 'react';
import { Mail, Clock, Shield, Zap } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthButton } from './components/AuthButton';
import { EmailScheduler } from './components/EmailScheduler';
import { EmailList } from './components/EmailList';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEmailScheduled = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-red-600 rounded-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                  Gmail Scheduler
                </h1>
                <p className="text-sm text-gray-500">Schedule emails with ease</p>
              </div>
            </div>
            <AuthButton user={user} onAuthStateChange={handleAuthStateChange} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // Landing page
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-red-600 rounded-full w-20 h-20 mx-auto mb-6">
                <Mail className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Schedule Your Gmail Emails
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Never miss an important email again. Schedule your Gmail messages to be sent at the perfect time, 
                even when you're offline.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="text-center p-6">
                <div className="p-3 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4">
                  <Clock className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Perfect Timing</h3>
                <p className="text-gray-600">Send emails at the optimal time for maximum impact</p>
              </div>
              
              <div className="text-center p-6">
                <div className="p-3 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4">
                  <Shield className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">Your emails and data are protected with enterprise-grade security</p>
              </div>
              
              <div className="text-center p-6">
                <div className="p-3 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-4">
                  <Zap className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Always Reliable</h3>
                <p className="text-gray-600">Emails are sent automatically, even when you're away</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-4">Get Started</h3>
              <p className="text-gray-600 mb-6">
                Sign in with your Google account to start scheduling emails with Gmail.
              </p>
              <AuthButton user={user} onAuthStateChange={handleAuthStateChange} />
            </div>
          </div>
        ) : (
          // Dashboard
          <div className="space-y-8">
            {/* Welcome message */}
            <div className="bg-gradient-to-r from-blue-600 to-red-600 rounded-xl text-white p-6">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user.email?.split('@')[0]}!
              </h2>
              <p className="opacity-90">
                {user.user_metadata?.gmail_access_token 
                  ? "Your Gmail account is connected and ready to use."
                  : "Please connect your Gmail account to start scheduling emails."
                }
              </p>
            </div>

            {user.user_metadata?.gmail_access_token ? (
              <div className="grid lg:grid-cols-2 gap-8">
                <EmailScheduler user={user} onEmailScheduled={handleEmailScheduled} />
                <EmailList user={user} refreshTrigger={refreshTrigger} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Connect Your Gmail</h3>
                <p className="text-gray-600 mb-6">
                  To start scheduling emails, you need to connect your Gmail account.
                </p>
                <AuthButton user={user} onAuthStateChange={handleAuthStateChange} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Gmail Scheduler. Built with Supabase and React.</p>
            <p className="text-sm mt-2">
              Secure email scheduling powered by Gmail API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;