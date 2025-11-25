import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`fixed top-6 right-6 z-50 p-3 rounded-full ${
        theme === 'dark'
          ? 'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 text-yellow-400'
          : 'bg-white/60 backdrop-blur-xl border border-slate-300/50 text-slate-700'
      } shadow-lg transition-colors`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.5 }}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.div>
    </motion.button>
  );
}
