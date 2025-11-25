import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Idea } from '../types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { IdeaCloud } from './IdeaCloud';
import { useTheme } from '../contexts/ThemeContext';

const NEON_COLORS_DARK = [
  'rgba(0, 255, 136, 0.7)',
  'rgba(0, 217, 255, 0.7)',
  'rgba(255, 107, 157, 0.7)',
  'rgba(255, 201, 64, 0.7)',
  'rgba(138, 43, 226, 0.7)',
  'rgba(75, 0, 130, 0.7)',
];

const PASTEL_COLORS_LIGHT = [
  'rgba(255, 182, 193, 0.8)',
  'rgba(173, 216, 230, 0.8)',
  'rgba(221, 160, 221, 0.8)',
  'rgba(255, 218, 185, 0.8)',
  'rgba(152, 251, 152, 0.8)',
  'rgba(255, 240, 245, 0.8)',
];

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showIdeaCloud, setShowIdeaCloud] = useState(false);
  const { theme } = useTheme();
  const inactivityTimeoutRef = useRef<number | null>(null);

  const generateRandomPosition = useCallback((existingIdeas: Idea[]): { x: number; y: number } => {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 70 + 15;

      const tooClose = existingIdeas.some((idea) => {
        const distance = Math.sqrt(
          Math.pow(idea.position.x - x, 2) + Math.pow(idea.position.y - y, 2)
        );
        return distance < 15;
      });

      if (!tooClose) {
        return { x, y };
      }

      attempts++;
    }

    return {
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = window.setTimeout(() => {
      setIsInputFocused(false);
      setShowIdeaCloud(false);
    }, 120000);
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const colorPalette = theme === 'dark' ? NEON_COLORS_DARK : PASTEL_COLORS_LIGHT;
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      const newIdea: Idea = {
        id: userMessage.id,
        content: content.length > 40 ? content.substring(0, 40) + '...' : content,
        position: generateRandomPosition(ideas),
        color: randomColor,
      };

      setIdeas((prev) => [...prev, newIdea]);

      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `He recibido tu mensaje: "${content}". Soy ChatJAi, tu asistente inteligente del Projex JAi. ¿En qué más puedo ayudarte?`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 1000);

      resetInactivityTimer();
    },
    [theme, ideas, generateRandomPosition, resetInactivityTimer]
  );

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setShowIdeaCloud(true);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleInputBlur = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const handleToggleIdeaCloud = useCallback(() => {
    setShowIdeaCloud((prev) => !prev);
    if (!showIdeaCloud) {
      setIsInputFocused(true);
    }
  }, [showIdeaCloud]);

  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '0',
      content:
        '¡Bienvenido a ChatJAi! Soy tu asistente inteligente del ecosistema Projex JAi. Estoy aquí para ayudarte con lo que necesites. ¿En qué puedo asistirte hoy?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  return (
    <div className="relative h-screen flex flex-col">
      <IdeaCloud
        ideas={ideas}
        isVisible={showIdeaCloud}
        onToggleVisibility={handleToggleIdeaCloud}
      />

      <div
        className={`flex flex-col transition-all duration-500 ${
          showIdeaCloud ? 'h-[70vh]' : 'h-full'
        }`}
        style={{
          marginTop: showIdeaCloud ? '30vh' : '0',
        }}
      >
        <div className="flex-1 relative flex flex-col">
          <MessageList messages={messages} />
          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            isFocused={isInputFocused}
          />
        </div>
      </div>
    </div>
  );
}
