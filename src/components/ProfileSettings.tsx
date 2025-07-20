import React, { useContext, useState, useRef } from 'react';
import { useEffect } from 'react';
import { AuthContext } from '../App';
import { supabase, UserPreferences } from '../lib/supabase';
import Header from './Header';
import { User, Bell, Shield, Palette, Globe, Save, Camera, Award, Brain, Key, Upload, X } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: user?.organization || '',
    bio: '',
    timezone: 'UTC-8',
    language: 'en'
  });

  const [apiKeys, setApiKeys] = useState({
    googleApiKey: '',
    groqApiKey: ''
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setLoadingPrefs(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

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
    }
  };
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth?.updateUser({
      name: formData.name,
      organization: formData.organization
    });
    alert('Profile updated successfully!');
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences({
      google_api_key: apiKeys.googleApiKey,
      groq_api_key: apiKeys.groqApiKey
    });
    alert('API keys updated successfully!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKeys({
      ...apiKeys,
      [e.target.name]: e.target.value
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }

    return null;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local user state
      auth?.updateUser({
        avatar_url: publicUrl
      });

      alert('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (loadingPrefs) {
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
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {[
                { id: 'profile', name: 'Profile', icon: User },
                { id: 'api-integrations', name: 'API Integrations', icon: Brain },
                { id: 'notifications', name: 'Notifications', icon: Bell },
                { id: 'privacy', name: 'Privacy', icon: Shield },
                { id: 'appearance', name: 'Appearance', icon: Palette },
                { id: 'language', name: 'Language & Region', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Update your personal information and profile picture.
                  </p>
                </div>
                <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={user?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                        alt={user?.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={triggerFileUpload}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <Camera className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
                      <p className="text-sm text-gray-500 mb-2">Choose a photo that represents you (max 5MB)</p>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      
                      {/* Upload button */}
                      <button
                        type="button"
                        onClick={triggerFileUpload}
                        disabled={uploading}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      
                      {/* Error message */}
                      {uploadError && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <X className="w-4 h-4 mr-1" />
                          {uploadError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                        Bio (Optional)
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Tell us a bit about yourself..."
                      />
                    </div>
                  </div>

                  {/* Badges */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Your Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {user?.badges.map((badge, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'api-integrations' && (
              <div className="space-y-6">
                {/* API Provider Toggles */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">AI Provider Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enable and configure AI providers for enhanced engagement analysis.
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    {[
                      { 
                        key: 'google_api_enabled', 
                        label: 'Google AI (Gemini)', 
                        description: 'Enable Google Gemini for advanced sentiment analysis and content understanding',
                        icon: Brain
                      },
                      { 
                        key: 'groq_api_enabled', 
                        label: 'Groq AI', 
                        description: 'Enable Groq for high-speed inference and real-time processing',
                        icon: Brain
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

                {/* API Keys */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Securely store your API keys for enhanced AI functionality.
                    </p>
                  </div>
                  <form onSubmit={handleApiKeySubmit} className="p-6 space-y-6">
                    <div>
                      <label htmlFor="googleApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                        Google AI API Key
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="password"
                          id="googleApiKey"
                          name="googleApiKey"
                          value={apiKeys.googleApiKey}
                          onChange={handleApiKeyChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your Google AI API key"
                        />
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
                          type="password"
                          id="groqApiKey"
                          name="groqApiKey"
                          value={apiKeys.groqApiKey}
                          onChange={handleApiKeyChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your Groq API key"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Groq Console</a>
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save API Keys
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose how you want to be notified about events and updates.
                  </p>
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
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Control what information is visible to other users.
                  </p>
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
            )}

            {(activeTab === 'appearance' || activeTab === 'language') && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'appearance' ? 'Appearance' : 'Language & Region'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeTab === 'appearance' 
                      ? 'Customize the look and feel of your dashboard.'
                      : 'Set your preferred language and timezone.'
                    }
                  </p>
                </div>
                <div className="p-6">
                  <div className="text-center py-12">
                    <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600">
                      {activeTab === 'appearance' 
                        ? 'Theme customization options will be available soon.'
                        : 'Multi-language support will be available soon.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;