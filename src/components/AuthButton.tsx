import React from 'react';
import { LogIn, LogOut, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthButtonProps {
  user: any;
  onAuthStateChange: () => void;
}

export function AuthButton({ user, onAuthStateChange }: AuthButtonProps) {
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.send',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Sign in error:', error);
        alert('Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      onAuthStateChange();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const connectGmail = () => {
    if (!user) return;
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
    googleAuthUrl.searchParams.set('redirect_uri', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('state', user.id);
    
    window.location.href = googleAuthUrl.toString();
  };

  const hasGmailAccess = user?.user_metadata?.gmail_access_token;

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <LogIn size={20} />
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {!hasGmailAccess && (
        <button
          onClick={connectGmail}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Mail size={20} />
          Connect Gmail
        </button>
      )}
      
      <div className="flex items-center gap-2 text-gray-600">
        <img 
          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}`}
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm">{user.email}</span>
      </div>
      
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}