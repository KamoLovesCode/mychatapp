
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { GeminiIcon, UserIcon, SpeakerWaveIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
}

const BlinkingCursor: React.FC = () => (
  <span className="inline-block w-2 h-5 bg-gray-600 animate-pulse ml-1" aria-hidden="true" />
);

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-700' : 'bg-gray-200'}`}>
        {isUser ? <UserIcon /> : <GeminiIcon />}
      </div>
      <div className={`p-4 rounded-2xl max-w-[80%] ${isUser ? 'bg-gray-800 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
        <div className="prose prose-p:my-0 whitespace-pre-wrap text-inherit">
           {message.content}
           {isStreaming && <BlinkingCursor />}
        </div>
        {message.isAudioPlaying && (
            <div className="mt-2 pt-2 border-t border-gray-300/50">
                <div className="flex items-center text-xs text-gray-500 animate-pulse">
                    <SpeakerWaveIcon className="w-4 h-4 mr-2" />
                    Playing audio...
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
