
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Session, LiveServerMessage, Modality } from '@google/genai';
import { ChatMessage as ChatMessageType } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { WelcomeScreen } from './components/WelcomeScreen';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioTimeRef = useRef<number>(0);
  const activeAudioMessageIdRef = useRef<string | null>(null);

  const playAudioChunk = useCallback((base64Data: string, mimeType: string) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioData = bytes.buffer;

      const sampleRate = parseInt(mimeType.split('rate=')[1], 10) || 24000;
      
      const pcmData = new Int16Array(audioData);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      if (float32Data.length === 0) return;

      const buffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
      buffer.copyToChannel(float32Data, 0);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      const currentTime = audioContext.currentTime;
      const startTime = nextAudioTimeRef.current < currentTime ? currentTime : nextAudioTimeRef.current;
      
      source.start(startTime);
      nextAudioTimeRef.current = startTime + buffer.duration;
    } catch (e) {
        console.error("Error processing audio chunk:", e);
    }
  }, []);

  useEffect(() => {
    const connect = async () => {
      try {
        const session = await ai.live.connect({
          model: 'models/gemini-2.5-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (message.serverContent?.modelTurn?.parts) {
                const part = message.serverContent.modelTurn.parts[0];
                if (part.text) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'gemini') {
                      lastMessage.content += part.text;
                    }
                    return newMessages;
                  });
                }
                if (part.inlineData?.data) {
                  if (activeAudioMessageIdRef.current === null) {
                    setMessages(prev => {
                       const lastMessage = prev[prev.length - 1];
                       if (lastMessage && lastMessage.sender === 'gemini') {
                           activeAudioMessageIdRef.current = lastMessage.id;
                           return prev.map(msg => msg.id === lastMessage.id ? {...msg, isAudioPlaying: true} : msg);
                       }
                       return prev;
                    });
                  }
                  playAudioChunk(part.inlineData.data, part.inlineData.mimeType);
                }
              }
              if (message.serverContent?.turnComplete) {
                setIsLoading(false);
                if (activeAudioMessageIdRef.current) {
                    const messageId = activeAudioMessageIdRef.current;
                    setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, isAudioPlaying: false} : msg));
                    activeAudioMessageIdRef.current = null;
                }
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('Session error:', e);
              setError(`Session error: ${e.message}`);
              setIsLoading(false);
            },
          },
        });
        sessionRef.current = session;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to connect to Gemini Live session.';
        setError(errorMessage);
        console.error(e);
      }
    };
    connect();

    return () => {
      sessionRef.current?.close();
      audioContextRef.current?.close().catch(console.error);
    };
  }, [playAudioChunk]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (isLoading || !userInput.trim() || !sessionRef.current) return;
    
    if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setIsLoading(true);
    setError(null);
    nextAudioTimeRef.current = 0;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      sender: 'user',
      content: userInput,
    };
    
    setMessages(prevMessages => [
      ...prevMessages,
      userMessage,
      { id: `${Date.now()}-gemini`, sender: 'gemini', content: '' }
    ]);
    
    try {
        sessionRef.current.sendClientContent({
            turns: [userInput]
        });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-screen font-sans text-gray-800">
      <div className="flex-1 flex flex-col items-center w-full overflow-y-auto">
        <div className="w-full max-w-4xl px-4 pt-8 md:pt-12 pb-24 relative flex-1">
          {messages.length === 0 ? (
            <WelcomeScreen onSend={handleSendMessage} />
          ) : (
            <main className="space-y-6">
              {messages.map((msg, index) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isStreaming={isLoading && index === messages.length - 1 && !msg.isAudioPlaying} 
                />
              ))}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg max-w-md text-center">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>
          )}
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-50/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
