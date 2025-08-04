import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, FileText, Users, Shield, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic,
      title: 'Voice-First Writing',
      description: 'Speak your story naturally and watch it transform into polished text.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      icon: BookOpen,
      title: 'AI-Powered Editor',
      description: 'Professional editing tools enhanced with AI suggestions and insights.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Shield,
      title: 'Emotional Safety',
      description: 'Trauma-informed AI that respects boundaries and provides support.',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description: 'Access your work anywhere with automatic cloud synchronization.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Write Your Story with Storyline
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            The AI-powered writing platform that transforms your voice into compelling narratives. 
            Perfect for authors, memoirists, and storytellers.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/editor')}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Start Writing
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium border border-gray-200 dark:border-gray-700"
            >
              View Documents
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">10,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Writers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Words Written Daily</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
              <div className="text-gray-600 dark:text-gray-300">Voice Accuracy</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}