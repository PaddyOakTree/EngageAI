import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import Header from './Header';
import { Calendar, Clock, Users, TrendingUp, Play, Plus, Search, Filter, MapPin, Video, Award, Star } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description: string;
  organizer: string;
  startTime: string;
  endTime: string;
  date: string;
  attendees: number;
  maxAttendees: number;
  engagement: number;
  status: 'upcoming' | 'live' | 'completed';
  type: 'virtual' | 'hybrid' | 'in-person';
  location?: string;
  tags: string[];
  thumbnail: string;
}

const SessionsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'virtual' | 'hybrid' | 'in-person'>('all');

  // Mock sessions data - in real app, this would come from Supabase
  useEffect(() => {
    const mockSessions: Session[] = [
      {
        id: '1',
        title: 'AI & Machine Learning Summit 2025',
        description: 'Explore the latest advances in artificial intelligence and machine learning with industry experts.',
        organizer: 'Dr. Sarah Chen',
        startTime: '14:00',
        endTime: '16:00',
        date: '2025-01-25',
        attendees: 247,
        maxAttendees: 300,
        engagement: 92,
        status: 'upcoming',
        type: 'virtual',
        tags: ['AI', 'Machine Learning', 'Technology'],
        thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      },
      {
        id: '2',
        title: 'Future of Work Conference',
        description: 'Discussing remote work trends, digital transformation, and the evolving workplace.',
        organizer: 'Microsoft Teams',
        startTime: '10:00',
        endTime: '12:00',
        date: '2025-01-22',
        attendees: 156,
        maxAttendees: 200,
        engagement: 88,
        status: 'live',
        type: 'hybrid',
        location: 'San Francisco, CA',
        tags: ['Remote Work', 'Digital Transformation', 'Business'],
        thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      },
      {
        id: '3',
        title: 'Tech Innovation Workshop',
        description: 'Hands-on workshop covering emerging technologies and innovation methodologies.',
        organizer: 'Google Meet',
        startTime: '15:00',
        endTime: '17:00',
        date: '2025-01-20',
        attendees: 89,
        maxAttendees: 100,
        engagement: 95,
        status: 'completed',
        type: 'virtual',
        tags: ['Innovation', 'Technology', 'Workshop'],
        thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      },
      {
        id: '4',
        title: 'Cybersecurity Best Practices',
        description: 'Learn essential cybersecurity practices for modern organizations.',
        organizer: 'Security Institute',
        startTime: '13:00',
        endTime: '15:00',
        date: '2025-01-28',
        attendees: 0,
        maxAttendees: 150,
        engagement: 0,
        status: 'upcoming',
        type: 'in-person',
        location: 'New York, NY',
        tags: ['Cybersecurity', 'Security', 'Best Practices'],
        thumbnail: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      },
      {
        id: '5',
        title: 'Data Science Bootcamp',
        description: 'Intensive bootcamp covering data analysis, visualization, and machine learning.',
        organizer: 'Data Academy',
        startTime: '09:00',
        endTime: '17:00',
        date: '2025-01-30',
        attendees: 0,
        maxAttendees: 50,
        engagement: 0,
        status: 'upcoming',
        type: 'hybrid',
        location: 'Austin, TX',
        tags: ['Data Science', 'Analytics', 'Bootcamp'],
        thumbnail: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop'
      }
    ];
    setSessions(mockSessions);
    setFilteredSessions(mockSessions);
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(session => session.type === typeFilter);
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual': return <Video className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      case 'hybrid': return <Users className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
              <p className="text-gray-600 mt-1">
                Discover and join engaging events and workshops
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={session.thumbnail}
                  alt={session.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                    {session.status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>}
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-700">
                    {getTypeIcon(session.type)}
                    <span className="ml-1 capitalize">{session.type}</span>
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{session.title}</h3>
                  {session.engagement > 0 && (
                    <div className="flex items-center ml-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-600 ml-1">{session.engagement}%</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{session.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {session.startTime} - {session.endTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    {session.attendees} / {session.maxAttendees} attendees
                  </div>
                  {session.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {session.location}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {session.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">by {session.organizer}</span>
                  <Link
                    to={`/session/${session.id}`}
                    className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {session.status === 'live' ? (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Join Live
                      </>
                    ) : session.status === 'upcoming' ? (
                      'View Details'
                    ) : (
                      'View Recording'
                    )}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No sessions are available at the moment'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SessionsPage;