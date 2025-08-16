import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { PlusCircleIcon, ImageIcon, GlobeIcon, ArrowRightIcon, MicrophoneIcon } from './icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const MAX_CHAR_COUNT = 1000;

// Type for SpeechRecognition instance to avoid type errors
interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

// Check for browser support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Use a ref to hold the latest inputValue to avoid stale closures in event handlers
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);


  const handleMicClick = () => {
    if (isLoading || !isSpeechRecognitionSupported) {
        return;
    }

    if (isRecording) {
        recognitionRef.current?.stop();
        return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false; // Set to false to automatically stop on pause
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        setInputValue('');
        setIsRecording(true);
    };

    recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
        // Use the ref to get the latest transcript and send it
        const finalTranscript = inputValueRef.current.trim();
        if (finalTranscript) {
            onSend(finalTranscript);
            setInputValue('');
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        setInputValue(transcript);
    };

    recognition.start();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        recognitionRef.current?.abort();
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3.5">
        <div className="relative">
            <div className="absolute top-0 right-0">
                <button className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 font-medium px-2 py-1 rounded-md hover:bg-gray-200 transition-colors">
                    <GlobeIcon />
                    All Web
                </button>
            </div>
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask whatever you want..."
                rows={1}
                maxLength={MAX_CHAR_COUNT}
                disabled={isLoading}
                className="w-full bg-transparent pr-24 pt-1 text-gray-800 placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 text-base"
                style={{ maxHeight: '200px' }}
            />
        </div>
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <PlusCircleIcon />
                    Add Attachment
                </button>
                 <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <ImageIcon />
                    Use Image
                </button>
                <button 
                    onClick={handleMicClick}
                    disabled={isLoading || !isSpeechRecognitionSupported}
                    className={`flex items-center gap-1.5 text-sm hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? "text-red-500" : "text-gray-600"}`}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                    <MicrophoneIcon className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                    {isRecording ? 'Listening...' : 'Use Mic'}
                </button>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                    {inputValue.length}/{MAX_CHAR_COUNT}
                </span>
                <button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    aria-label="Send message"
                >
                    <ArrowRightIcon />
                </button>
            </div>
        </div>
    </div>
  );
};