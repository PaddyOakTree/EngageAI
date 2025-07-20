import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, Users, TrendingUp, Calendar, Crown, Star } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url?: string;
  organization?: string;
  engagement_score: number;
  total_events: number;
  badges: string[];
  rank: number;
}

interface LeaderboardProps {
  timeframe?: 'weekly' | 'monthly' | 'all-time';
  organization?: string;
  limit?: number;
  showCurrentUser?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ 
  timeframe = 'all-time', 
  organization, 
  limit = 10,
  showCurrentUser = true 
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'engagement' | 'events'>('engagement');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, organization, selectedMetric, user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query based on selected metric
      let query = supabase
        .from('profiles')
        .select('id, name, avatar_url, organization, engagement_score, total_events, badges');
        // Note: privacy_leaderboard_visible column doesn't exist in current schema

      // Filter by organization if specified
      if (organization) {
        query = query.eq('organization', organization);
      }

      // Order by selected metric
      if (selectedMetric === 'engagement') {
        query = query.order('engagement_score', { ascending: false });
      } else {
        query = query.order('total_events', { ascending: false });
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Add rank to each entry
      const rankedData = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setLeaderboard(rankedData);

      // Find current user's rank if they're not in the top results
      if (user && showCurrentUser) {
        const userInTop = rankedData.find(entry => entry.id === user.id);
        
        if (!userInTop) {
          // Fetch user's rank separately
          const { data: allUsers, error: rankError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, organization, engagement_score, total_events, badges')
            .order(selectedMetric === 'engagement' ? 'engagement_score' : 'total_events', { ascending: false });

          if (!rankError && allUsers) {
            const userIndex = allUsers.findIndex(entry => entry.id === user.id);
            if (userIndex !== -1) {
              setCurrentUserRank({
                ...allUsers[userIndex],
                rank: userIndex + 1
              });
            }
          }
        } else {
          setCurrentUserRank(userInTop);
        }
      }

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="w-6 h-6 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
              <p className="text-sm text-gray-600">
                Top performers {organization ? `in ${organization}` : 'across all organizations'}
              </p>
            </div>
          </div>
          
          {/* Metric Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('engagement')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                selectedMetric === 'engagement'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Engagement
            </button>
            <button
              onClick={() => setSelectedMetric('events')}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                selectedMetric === 'events'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Events
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No leaderboard data available</p>
            <p className="text-sm text-gray-400">Users need to opt-in to leaderboard visibility</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                  entry.id === user?.id 
                    ? 'bg-indigo-50 border-2 border-indigo-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadgeColor(entry.rank)}`}>
                    {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={entry.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {entry.name}
                        {entry.id === user?.id && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </h3>
                      {entry.organization && (
                        <p className="text-sm text-gray-500">{entry.organization}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {selectedMetric === 'engagement' ? `${entry.engagement_score}%` : entry.total_events}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedMetric === 'engagement' ? 'Engagement' : 'Events'}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-1">
                    {entry.badges.slice(0, 3).map((badge, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center"
                        title={badge}
                      >
                        <Star className="w-3 h-3 text-indigo-600" />
                      </div>
                    ))}
                    {entry.badges.length > 3 && (
                      <span className="text-xs text-gray-500">+{entry.badges.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current User Rank (if not in top results) */}
        {currentUserRank && currentUserRank.rank > limit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Your position:</p>
            <div className="flex items-center justify-between p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-700">#{currentUserRank.rank}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={currentUserRank.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                    alt={currentUserRank.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{currentUserRank.name} (You)</h3>
                    {currentUserRank.organization && (
                      <p className="text-sm text-gray-500">{currentUserRank.organization}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {selectedMetric === 'engagement' ? `${currentUserRank.engagement_score}%` : currentUserRank.total_events}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedMetric === 'engagement' ? 'Engagement' : 'Events'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;