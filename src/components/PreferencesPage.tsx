import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { supabase, UserPreferences } from '../lib/supabase';
import Header from './Header';
import { Bell, Shield, Palette, Globe, Save, Brain, Key, Zap, Settings, Lock, Eye, EyeOff } from 'lucide-react';

const PreferencesPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    google: false,
    groq: false
  });

  const [apiKeys, setApiKeys] = useState({
    googleApiKey: '',
    groqApiKey: ''
  });

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
        setApiKeys({
          googleApiKey: data.google_api_key || '',
          groqApiKey: data.groq_api_key || ''
        });
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) {
          console.error('Error creating preferences:', createError);
        } else {
          setPreferences(newPrefs);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return;
      }

      setPreferences({ ...preferences, ...updates });
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences({
      google_api_key: apiKeys.googleApiKey,
      groq_api_key: apiKeys.groqApiKey,
      google_api_enabled: !!apiKeys.googleApiKey,
      groq_api_enabled: !!apiKeys.groqApiKey
    });
    alert('API keys updated successfully!');
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys({
      ...apiKeys,
      [e.target.name]: e.target.value
    });
  };

  const toggleApiKeyVisibility = (provider: 'google' | 'groq') => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
          <p className="text-gray-600 mt-1">
            Customize your EngageAI experience and manage integrations.
          </p>
        </div>

        <div className="space-y-8">
          {/* AI Integrations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Brain className="w-6 h-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Provider Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable and configure AI providers for enhanced engagement analysis.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Provider Toggles */}
              <div className="space-y-4">
                {[
                  { 
                    key: 'google_api_enabled', 
                    label: 'Google AI (Gemini)', 
                    description: 'Enable Google Gemini for advanced sentiment analysis and content understanding',
                    icon: Brain,
                    status: preferences?.google_api_enabled
                  },
                  { 
                    key: 'groq_api_enabled', 
                    label: 'Groq AI', 
                    description: 'Enable Groq for high-speed inference and real-time processing',
                    icon: Zap,
                    status: preferences?.groq_api_enabled
                  }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-4">
                        <setting.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        setting.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {setting.status ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => updatePreferences({
                          [setting.key]: !preferences?.[setting.key as keyof UserPreferences]
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences?.[setting.key as keyof UserPreferences]
                            ? 'bg-indigo-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences?.[setting.key as keyof UserPreferences]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* API Keys Form */}
              <form onSubmit={handleApiKeySubmit} className="space-y-6 pt-6 border-t border-gray-200">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    API Keys
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                        Google AI API Key
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type={showApiKeys.google ? "text" : "password"}
                          id="googleApiKey"
                          name="googleApiKey"
                          value={apiKeys.googleApiKey}
                          onChange={handleApiKeyChange}
                          className="pl-10 pr-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your Google AI API key"
                        />
                        <button
                          type="button"
                          onClick={() => toggleApiKeyVisibility('google')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKeys.google ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Google AI Studio</a>
                      </p>
                    </div>

                    <div>
                      <label htmlFor="groqApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                        Groq API Key
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type={showApiKeys.groq ? "text" : "password"}
                          id="groqApiKey"
                          name="groqApiKey"
                          value={apiKeys.groqApiKey}
                          onChange={handleApiKeyChange}
                          className="pl-10 pr-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your Groq API key"
                        />
                        <button
                          type="button"
                          onClick={() => toggleApiKeyVisibility('groq')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKeys.groq ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Groq Console</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save API Keys
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Bell className="w-6 h-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose how you want to be notified about events and updates.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {[
                { key: 'notification_email', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'notification_push', label: 'Push Notifications', description: 'Receive browser push notifications' },
                { key: 'notification_session_reminders', label: 'Session Reminders', description: 'Get reminded before sessions start' },
                { key: 'notification_engagement_updates', label: 'Engagement Updates', description: 'Updates about your engagement score' },
                { key: 'notification_weekly_report', label: 'Weekly Report', description: 'Weekly summary of your activity' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({
                      [setting.key]: !preferences?.[setting.key as keyof UserPreferences]
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences?.[setting.key as keyof UserPreferences]
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences?.[setting.key as keyof UserPreferences]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Control what information is visible to other users.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {[
                { key: 'privacy_profile_visible', label: 'Profile Visibility', description: 'Make your profile visible to other users' },
                { key: 'privacy_engagement_visible', label: 'Engagement Score Visibility', description: 'Show your engagement score to others' },
                { key: 'privacy_badges_visible', label: 'Badges Visibility', description: 'Display your earned badges publicly' },
                { key: 'privacy_leaderboard_visible', label: 'Leaderboard Participation', description: 'Include your profile in leaderboards' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{setting.label}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({
                      [setting.key]: !preferences?.[setting.key as keyof UserPreferences]
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences?.[setting.key as keyof UserPreferences]
                        ? 'bg-indigo-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences?.[setting.key as keyof UserPreferences]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data & Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Lock className="w-6 h-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Data & Security</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your data and security preferences.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500">Download all your engagement data</p>
                </div>
                <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                  Export
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreferencesPage;