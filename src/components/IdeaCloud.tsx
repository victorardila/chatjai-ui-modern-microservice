import { motion, AnimatePresence } from 'framer-motion';
import { Idea } from '../types/chat';
import { useTheme } from '../contexts/ThemeContext';
import { X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface IdeaCloudProps {
  ideas: Idea[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function IdeaCloud({ ideas, isVisible, onToggleVisibility }: IdeaCloudProps) {
  const { theme } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{
        opacity: isMinimized ? 0.1 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
      style={{ height: '30vh' }}
    >
      <div
        className={`relative w-full h-full overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-900/30 backdrop-blur-sm'
            : 'bg-white/30 backdrop-blur-sm'
        }`}
        style={{
          backgroundImage:
            theme === 'dark'
              ? 'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)'
              : 'linear-gradient(rgba(100, 116, 139, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.12) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      >
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                : 'bg-white/80 hover:bg-slate-100/80 text-slate-700'
            } backdrop-blur-md border ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-300'
            } transition-colors`}
          >
            {isMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleVisibility}
            className={`p-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300'
                : 'bg-red-100/80 hover:bg-red-200/80 text-red-700'
            } backdrop-blur-md border ${
              theme === 'dark' ? 'border-red-800' : 'border-red-300'
            } transition-colors`}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {!isMinimized && (
          <div className="relative w-full h-full p-4 pointer-events-auto">
            <AnimatePresence>
              {ideas.map((idea) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 0.7,
                    scale: 1,
                    x: [0, 2, -2, 0],
                    y: [0, -3, 3, 0],
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 0.5,
                    x: {
                      repeat: Infinity,
                      duration: 4,
                      ease: 'easeInOut',
                    },
                    y: {
                      repeat: Infinity,
                      duration: 3,
                      ease: 'easeInOut',
                    },
                  }}
                  className="absolute"
                  style={{
                    left: `${idea.position.x}%`,
                    top: `${idea.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={`px-4 py-2 rounded-full backdrop-blur-md border shadow-lg max-w-xs ${
                      theme === 'dark'
                        ? 'border-white/20 text-white'
                        : 'border-black/10 text-slate-800'
                    }`}
                    style={{
                      backgroundColor: idea.color,
                      boxShadow:
                        theme === 'dark'
                          ? `0 4px 20px ${idea.color}40`
                          : `0 4px 20px ${idea.color}60`,
                    }}
                  >
                    <p className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {idea.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
