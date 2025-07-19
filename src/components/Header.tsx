import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../App';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Bell, Search, Settings, User, LogOut, Shield } from 'lucide-react';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">EngageAI</span>
            </Link>
            
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/sessions"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/sessions')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Sessions
              </Link>
              <Link
                to="/analytics"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/analytics')
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Analytics
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Search and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search sessions..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src={user?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile & Settings
                  </Link>
                  
                  <Link
                    to="/preferences"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Preferences
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Shield className="h-4 w-4 mr-3" />
                      Admin Panel
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={() => {
                        auth?.logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;