import { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { ChatContainer } from './components/ChatContainer';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { theme } = useTheme();
  const [isBlurred, setIsBlurred] = useState(false);

  return (
    <div className={`relative min-h-screen ${theme === 'dark' ? 'bg-[#070B14]' : 'bg-[#F3F6FC]'}`}>
      <BackgroundCanvas isBlurred={isBlurred} />

      <ThemeSwitcher />

      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600'
              : 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500'
          } shadow-2xl`}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <h1
            className={`text-2xl font-bold ${
              theme === 'dark'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-700'
            }`}
          >
            ChatJAi
          </h1>
          <p
            className={`text-xs ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Projex JAi Microservice
          </p>
        </div>
      </div>

      <div className="relative z-10 h-screen">
        <ChatContainer />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
