
export type MessageSender = 'user' | 'gemini';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  isAudioPlaying?: boolean;
}
