import { motion } from 'framer-motion';
import { Sparkles, BarChart3, FileText, Zap, ArrowRight } from 'lucide-react';
import ClickSpark from './ClickSpark';

const HeroSection = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-20 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-sm"
            >
              <span className="text-sm font-medium text-indigo-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Powered Note Generation
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight"
            >
              AI-Powered Summaries for{' '}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Webinars, Meetings, Research Talks & Training Videos
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              StenoMind converts long video recordings into clean, structured, actionable notes — instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <ClickSpark sparkColor="#6366f1" sparkCount={8} sparkRadius={20}>
                <button
                  onClick={() => onNavigate('generate')}
                  className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center justify-center gap-2 cursor-target"
                >
                  Generate Summary
                  <ArrowRight className="w-5 h-5" />
                </button>
              </ClickSpark>

              <ClickSpark sparkColor="#8b5cf6" sparkCount={6}>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transform hover:-translate-y-1 transition cursor-target"
                >
                  View Dashboard
                </button>
              </ClickSpark>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-4 pt-8"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">10K+</div>
                <div className="text-sm text-gray-600">Videos Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">5 Min</div>
                <div className="text-sm text-gray-600">Avg Processing</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Animated Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              {/* Floating Icons */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-10 -left-10 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center cursor-target"
              >
                <Sparkles className="w-10 h-10 text-indigo-600" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-10 -right-10 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center cursor-target"
              >
                <Zap className="w-10 h-10 text-purple-600" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-1/2 -right-16 w-16 h-16 bg-white rounded-xl shadow-xl flex items-center justify-center cursor-target"
              >
                <BarChart3 className="w-8 h-8 text-pink-600" />
              </motion.div>

              {/* Main Dashboard Mockup */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-6 space-y-4 cursor-target"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Latest Notes</div>
                      <div className="text-sm text-gray-500">AI Generated</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Active
                  </div>
                </div>

                {/* Mock Content */}
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-target"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-3 bg-indigo-200 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </motion.div>
                  ))}
                </div>

                {/* Mock Chart */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                        className="flex-1 bg-linear-to-t from-indigo-500 to-purple-500 rounded-t-lg cursor-target"
                      ></motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
