import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Users, BarChart3, Zap, Award, Shield, ArrowRight, Play } from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analytics',
      description: 'Advanced sentiment analysis and engagement scoring with multi-model AI support'
    },
    {
      icon: Users,
      title: 'Real-time Tracking',
      description: 'Live engagement monitoring across Zoom, Teams, and other platforms'
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Dashboard',
      description: 'Beautiful visualizations and actionable insights for organizers and participants'
    },
    {
      icon: Award,
      title: 'Gamification',
      description: 'Badges, leaderboards, and rewards to boost event participation'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'GDPR/CCPA compliant with consent-driven tracking and data protection'
    },
    {
      icon: Zap,
      title: 'Seamless Integration',
      description: 'Easy setup with popular conferencing tools and event platforms'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">EngageAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-8">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Event Engagement
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Transform Event
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                {' '}Engagement
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Bridge the gap between attendance and actual engagement with AI-powered insights,
              real-time tracking, and beautiful analytics that drive meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Engaged Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and AI insights to measure, understand, and improve event engagement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-6 group-hover:bg-indigo-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready for a Live Demo?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Experience EngageAI in action with our interactive Zoom integration demo.
              See real-time engagement tracking and AI insights.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Schedule Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-semibold">EngageAI</span>
            </div>
            <p className="text-gray-400">
              © 2025 EngageAI. Transforming event engagement with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;