import { motion } from 'framer-motion';
import { Message } from '../types/chat';
import { useTheme } from '../contexts/ThemeContext';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser
            ? theme === 'dark'
              ? 'bg-gradient-to-br from-blue-500 to-purple-600'
              : 'bg-gradient-to-br from-blue-400 to-purple-500'
            : theme === 'dark'
            ? 'bg-gradient-to-br from-emerald-500 to-cyan-600'
            : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div
        className={`max-w-[70%] rounded-2xl px-5 py-3 ${
          isUser
            ? theme === 'dark'
              ? 'bg-blue-600/20 backdrop-blur-md border border-blue-500/30 text-blue-50'
              : 'bg-blue-100/80 backdrop-blur-md border border-blue-300/50 text-blue-900'
            : theme === 'dark'
            ? 'bg-slate-800/40 backdrop-blur-md border border-slate-700/50 text-slate-100'
            : 'bg-white/80 backdrop-blur-md border border-slate-200/50 text-slate-900'
        } ${isUser ? 'shadow-lg shadow-blue-500/20' : 'shadow-lg shadow-slate-900/10'}`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <span
          className={`text-xs mt-2 block ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  );
}
