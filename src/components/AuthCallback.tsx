import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
          // User is authenticated, redirect to dashboard
          navigate('/dashboard');
        } else if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=confirmation_failed');
        } else {
          // No session, redirect to auth page
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/auth?error=confirmation_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your email...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we verify your account.</p>
      </div>
    </div>
  );
};

export default AuthCallback; 