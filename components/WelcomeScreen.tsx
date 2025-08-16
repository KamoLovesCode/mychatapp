import React from 'react';
import { UserIcon, MailIcon, FileTextIcon, SlidersIcon, RefreshIcon } from './icons';

interface WelcomeScreenProps {
    onSend: (message: string) => void;
}

const prompts = [
    {
        text: "Write a to-do list for a personal project or task",
        icon: <UserIcon className="w-5 h-5 text-gray-500" />
    },
    {
        text: "Generate an email to reply to a job offer",
        icon: <MailIcon className="w-5 h-5 text-gray-500" />
    },
    {
        text: "Summarise this article or text for me in one paragraph",
        icon: <FileTextIcon className="w-5 h-5 text-gray-500" />
    },
    {
        text: "How does AI work in a technical capacity",
        icon: <SlidersIcon className="w-5 h-5 text-gray-500" />
    }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSend }) => {
    return (
        <div className="flex flex-col justify-center h-full text-left text-gray-800">
            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                    <span className="text-gray-900">Hi there, John</span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                        What would you like to know?
                    </span>
                </h1>
                <p className="text-gray-500 mb-10">
                    Use one of the most common prompts below or use your own to begin
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {prompts.map((prompt) => (
                        <button
                            key={prompt.text}
                            onClick={() => onSend(prompt.text)}
                            className="bg-white p-4 rounded-xl text-left border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 h-32 flex flex-col justify-between"
                        >
                           <p className="text-gray-700 text-sm">{prompt.text}</p>
                           {prompt.icon}
                        </button>
                    ))}
                </div>
                
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    <RefreshIcon />
                    Refresh Prompts
                </button>
            </div>
        </div>
    );
};