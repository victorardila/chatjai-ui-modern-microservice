import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { JaiAssistantModel, AssistantMood } from "./JaiAssistantModel";

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
}

interface MessageListProps {
  messages: Message[];
  assistantMood: AssistantMood;
  modelSide: "left" | "right";
  isInputFocused: boolean;
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  ({ messages, assistantMood, modelSide, isInputFocused }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const modelContainerRef = useRef<HTMLDivElement>(null);
    const slideAudioRef = useRef<HTMLAudioElement | null>(null);
    const isFirstRender = useRef(true);

    // Precarga el audio una sola vez
    useEffect(() => {
      slideAudioRef.current = new Audio("/sound/desplazamiento1.mp3");
      slideAudioRef.current.volume = 0.5;
      return () => {
        slideAudioRef.current?.pause();
        slideAudioRef.current = null;
      };
    }, []);

    // Reproduce al desplazarse (entrada o salida), ignora el montaje inicial
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      const audio = slideAudioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // El navegador puede bloquear autoplay sin interacción previa — se ignora silenciosamente
      });
    }, [isInputFocused]);

    useImperativeHandle(ref, () => ({
      scrollToMessage: (id: string) => {
        messageRefs.current
          .get(id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    }));

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={(el) => {
                if (el) messageRefs.current.set(message.id, el);
                else messageRefs.current.delete(message.id);
              }}
            >
              {message.id === "0" ? (
                <div className="mb-6">
                  <MessageBubble message={message} index={index} />
                  <div
                    style={{
                      height: isInputFocused ? "0" : "50vh",
                      width: "280px",
                      pointerEvents: "none",
                    }}
                    className={`mt-3 ${modelSide === "right" ? "ml-auto pr-4" : ""}`}
                  />
                  <div
                    ref={modelContainerRef}
                    className="transition-all duration-500 ease-in-out"
                    style={
                      isInputFocused
                        ? {
                            position: "fixed",
                            bottom: "100px",
                            right: "calc(37% - 32rem)",
                            zIndex: 40,
                          }
                        : {
                            position: "relative",
                            marginTop: "-50vh",
                            height: "50vh",
                            width: "100%",
                            marginLeft: modelSide === "right" ? "auto" : "0",
                            paddingRight: modelSide === "right" ? "16px" : "0",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent:
                              modelSide === "right" ? "center" : "flex-start",
                          }
                    }
                  >
                    <JaiAssistantModel mood={assistantMood} side={modelSide} />
                  </div>
                </div>
              ) : (
                <MessageBubble message={message} index={index} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  },
);
