export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface Idea {
  id: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
}

export type AssistantMood =
  | "idle"
  | "thinking"
  | "talking"
  | "greeting"
  | "excited";

export type Theme = "dark" | "light";
