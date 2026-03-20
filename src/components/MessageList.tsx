import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";

export interface MessageListHandle {
  scrollToMessage: (messageId: string) => void;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
  ({ messages }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useImperativeHandle(ref, () => ({
      scrollToMessage: (messageId: string) => {
        const el = messageRefs.current.get(messageId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
              <MessageBubble message={message} index={index} />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  },
);
