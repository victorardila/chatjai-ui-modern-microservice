// components/ChatInput.tsx
import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
}

export function ChatInput({
  onSendMessage,
  onFocus,
  onBlur,
  isFocused,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const { theme } = useTheme();

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          animate={{
            boxShadow: isFocused
              ? theme === "dark"
                ? "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2)"
                : "0 0 30px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)"
              : "none",
          }}
          transition={{ duration: 0.4 }}
          className={`flex items-end gap-3 rounded-2xl p-4 ${
            theme === "dark"
              ? "bg-slate-900/60 backdrop-blur-xl border border-slate-700/50"
              : "bg-white/80 backdrop-blur-xl border border-slate-300/50"
          }`}
        >
          <div className="flex-shrink-0">
            <motion.div
              animate={{ rotate: isFocused ? 360 : 0 }}
              transition={{ duration: 0.6 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                theme === "dark"
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                  : "bg-gradient-to-br from-cyan-400 to-blue-500"
              }`}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Escribe tu mensaje a ChatJAi..."
            rows={1}
            className={`flex-1 bg-transparent outline-none resize-none max-h-32 ${
              theme === "dark"
                ? "text-slate-100 placeholder-slate-400"
                : "text-slate-900 placeholder-slate-500"
            }`}
            style={{
              minHeight: "24px",
              maxHeight: "128px",
            }}
          />

          <motion.button
            onClick={handleSend}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim()}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              input.trim()
                ? theme === "dark"
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  : "bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"
                : theme === "dark"
                  ? "bg-slate-700 opacity-50 cursor-not-allowed"
                  : "bg-slate-300 opacity-50 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
