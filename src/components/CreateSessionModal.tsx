import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, Users, MapPin, Video, Plus, Tag } from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSessionCreated }) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    type: 'virtual' as 'virtual' | 'hybrid' | 'in-person',
    location: '',
    meeting_url: '',
    max_attendees: '',
    tags: '',
    thumbnail_url: '',
    ai_models: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from('sessions')
        .insert({
          title: formData.title,
          description: formData.description,
          organizer: user.name,
          organizer_id: user.id,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          type: formData.type,
          location: formData.location || null,
          meeting_url: formData.meeting_url || null,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          tags: tagsArray,
          thumbnail_url: formData.thumbnail_url || null,
          ai_models: formData.ai_models,
          status: 'upcoming',
          attendees: 0,
          engagement_score: 0
        });

      if (error) {
        console.error('Error creating session:', error);
        alert('Failed to create session');
        return;
      }

      alert('Session created successfully!');
      onSessionCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        type: 'virtual',
        location: '',
        meeting_url: '',
        max_attendees: '',
        tags: '',
        thumbnail_url: '',
        ai_models: []
      });
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAiModelToggle = (model: string) => {
    setFormData(prev => ({
      ...prev,
      ai_models: prev.ai_models.includes(model)
        ? prev.ai_models.filter(m => m !== model)
        : [...prev.ai_models, model]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Session</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Session Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your session..."
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="AI, Machine Learning, Web Development"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    required
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>

              <div>
                <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attendees
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    id="max_attendees"
                    name="max_attendees"
                    min="1"
                    value={formData.max_attendees}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>

            {formData.type !== 'virtual' && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location {formData.type === 'in-person' ? '*' : ''}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required={formData.type === 'in-person'}
                    value={formData.location}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter location or address"
                  />
                </div>
              </div>
            )}

            {formData.type !== 'in-person' && (
              <div>
                <label htmlFor="meeting_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting URL {formData.type === 'virtual' ? '*' : ''}
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="url"
                    id="meeting_url"
                    name="meeting_url"
                    required={formData.type === 'virtual'}
                    value={formData.meeting_url}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail URL (Optional)
              </label>
              <input
                type="url"
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* AI Models */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Models for Session Analysis
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gemini"
                    checked={formData.ai_models.includes('Gemini')}
                    onChange={() => handleAiModelToggle('Gemini')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gemini" className="text-sm text-gray-700">Google Gemini</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="groq"
                    checked={formData.ai_models.includes('Groq')}
                    onChange={() => handleAiModelToggle('Groq')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="groq" className="text-sm text-gray-700">Groq AI</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="local"
                    checked={formData.ai_models.includes('Local')}
                    onChange={() => handleAiModelToggle('Local')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="local" className="text-sm text-gray-700">Local Analysis</label>
                </div>
              </div>
            </div>
          </div>

          {/* AI Models */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">AI Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpt-4"
                  name="gpt-4"
                  checked={formData.ai_models.includes('gpt-4')}
                  onChange={() => handleAiModelToggle('gpt-4')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="gpt-4" className="text-sm text-gray-700">GPT-4</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpt-3.5-turbo"
                  name="gpt-3.5-turbo"
                  checked={formData.ai_models.includes('gpt-3.5-turbo')}
                  onChange={() => handleAiModelToggle('gpt-3.5-turbo')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="gpt-3.5-turbo" className="text-sm text-gray-700">GPT-3.5 Turbo</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpt-3.5-turbo-16k"
                  name="gpt-3.5-turbo-16k"
                  checked={formData.ai_models.includes('gpt-3.5-turbo-16k')}
                  onChange={() => handleAiModelToggle('gpt-3.5-turbo-16k')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="gpt-3.5-turbo-16k" className="text-sm text-gray-700">GPT-3.5 Turbo 16k</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gpt-3.5-turbo-1106"
                  name="gpt-3.5-turbo-1106"
                  checked={formData.ai_models.includes('gpt-3.5-turbo-1106')}
                  onChange={() => handleAiModelToggle('gpt-3.5-turbo-1106')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="gpt-3.5-turbo-1106" className="text-sm text-gray-700">GPT-3.5 Turbo 1106</label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;