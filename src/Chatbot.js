import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MessageSquareMore } from 'lucide-react'; // Assuming lucide-react for icons

// Use environment variable for deployed backend URL, fallback to local for development
// IMPORTANT: Ensure REACT_APP_BACKEND_URL is set on Netlify to your Render backend URL (e.g., https://your-backend.onrender.com)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { sender: 'bot', text: "Hello! I'm Sheelaa's AI Assistant. How can I help you today? I can tell you about Sheelaa's services, contact details, or her background." }
            ]);
        }
    }, [isOpen, messages.length]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Send message to the backend
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                // If response is not OK (e.g., 404, 500), throw an error
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botMessage = { sender: 'bot', text: data.response };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            console.error('Error sending message to backend:', error);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: 'bot', text: 'Oops! Something went wrong. Please try again later or contact Sheelaa directly.' },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chatbot Toggle Button */}
            <button
                onClick={toggleChat}
                className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-all duration-300 ease-in-out transform hover:scale-105"
                aria-label="Toggle Chat"
            >
                <MessageSquareMore size={28} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 w-80 h-[400px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200">
                    {/* Chat Header */}
                    <div className="bg-purple-600 text-white p-4 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-semibold text-lg">Sheelaa AI Assistant</h3>
                        <button
                            onClick={toggleChat}
                            className="text-white hover:text-gray-200 focus:outline-none"
                            aria-label="Close Chat"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-3 p-2 rounded-lg max-w-[80%] ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-100 text-blue-800 ml-auto rounded-br-none'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="mb-3 p-2 rounded-lg max-w-[80%] bg-gray-100 text-gray-600 rounded-bl-none animate-pulse">
                                Sheelaa Bot is typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your message..."
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            className="hidden" // Hidden button, submission via Enter key
                            disabled={isTyping}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* Custom Scrollbar Styling (for custom-scrollbar class) */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
        </div>
    );
}

export default Chatbot;