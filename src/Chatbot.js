import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareMore, Mic, Volume2, VolumeX, X } from 'lucide-react'; // Added Mic, Volume2, VolumeX, X icons

// IMPORTANT: Hardcoded the Render backend URL for GitHub Pages deployment.
// GitHub Pages is a static host and does not process environment variables like Netlify.
const BACKEND_URL = 'https://sheelaa-chatbot-backend.onrender.com';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false); // State for speech recognition
    const [isSpeaking, setIsSpeaking] = useState(false); // State for text-to-speech
    const [voiceEnabled, setVoiceEnabled] = useState(true); // Toggle for voice replies
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null); // Ref for SpeechRecognition

    // Scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize SpeechRecognition on component mount
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Listen for a single utterance
            recognitionRef.current.interimResults = false; // Only final results

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                console.log('Voice recognition started. Speak into the microphone.');
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript); // Set transcribed text to input field
                console.log('Transcript:', transcript);
                // Optionally, automatically submit the form after transcription
                // if (transcript.trim() !== '') {
                //     handleSubmit(new Event('submit')); // Create a dummy event
                // }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                console.log('Voice recognition ended.');
            };

            recognitionRef.current.onerror = (event) => {
                setIsListening(false);
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please enable it in your browser settings.');
                }
            };
        } else {
            console.warn('Web Speech API (SpeechRecognition) not supported in this browser.');
        }

        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (speechSynthesis) {
                speechSynthesis.cancel(); // Stop any ongoing speech
            }
        };
    }, []);

    // Initial welcome message and automatic voice reply
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = { sender: 'bot', text: "Hello! I'm Sheelaa's AI Assistant. How can I help you today? I can tell you about Sheelaa's services, contact details, or her background." };
            setMessages([welcomeMessage]);
            if (voiceEnabled) {
                speakText(welcomeMessage.text);
            }
        }
    }, [isOpen, messages.length, voiceEnabled]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (isOpen && isListening) { // If closing chat and still listening, stop listening
            recognitionRef.current?.stop();
        }
        if (isOpen && isSpeaking) { // If closing chat and still speaking, stop speaking
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const speakText = (text) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) {
            console.warn('Text-to-speech not enabled or not supported.');
            return;
        }

        speechSynthesis.cancel(); // Stop any current speech
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set language for TTS (adjust as needed for multilingual responses)
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance error:', event);
            setIsSpeaking(false);
        };
        speechSynthesis.speak(utterance);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput('');
        setIsTyping(true);
        if (isSpeaking) { // Stop bot speech if user types/sends new message
            speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botMessage = { sender: 'bot', text: data.response };
            setMessages((prevMessages) => [...prevMessages, botMessage]);

            if (voiceEnabled) {
                speakText(botMessage.text);
            }

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

    const startListening = () => {
        if (recognitionRef.current) {
            if (isListening) {
                recognitionRef.current.stop(); // Stop if already listening
            } else {
                recognitionRef.current.start(); // Start listening
            }
        } else {
            alert('Speech recognition not supported in your browser.');
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chatbot Toggle Button */}
            <button
                onClick={toggleChat}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-75 transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
                aria-label="Toggle Chat"
            >
                <MessageSquareMore size={30} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 w-80 h-[400px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 transform transition-all duration-300 ease-in-out scale-100 opacity-100"
                     style={{
                        minWidth: '280px', // Minimum width
                        minHeight: '300px', // Minimum height
                        resize: 'both', // Enable resizing in both directions
                        overflow: 'auto', // Add scrollbars if content overflows during resize
                     }}
                >
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-xl shadow-md">
                        <h3 className="font-bold text-xl">Sheelaa AI Assistant</h3>
                        <div className="flex items-center space-x-2">
                            {/* Voice Toggle Button */}
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                                aria-label={voiceEnabled ? "Disable Voice Reply" : "Enable Voice Reply"}
                            >
                                {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={toggleChat}
                                className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                                aria-label="Close Chat"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-3 p-3 rounded-lg max-w-[85%] text-sm shadow-sm ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-500 text-white ml-auto rounded-br-none'
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="mb-3 p-3 rounded-lg max-w-[85%] bg-gray-200 text-gray-600 rounded-bl-none animate-pulse text-sm">
                                Sheelaa Bot is typing...
                            </div>
                        )}
                        {isSpeaking && (
                            <div className="mb-3 p-3 rounded-lg max-w-[85%] bg-purple-100 text-purple-700 rounded-bl-none animate-pulse text-sm">
                                Sheelaa Bot is speaking...
                            </div>
                        )}
                        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
                    </div>

                    {/* Chat Input and Controls */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={isListening ? "Listening..." : "Type your message..."}
                            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                            disabled={isTyping || isListening}
                        />
                        {/* Microphone Button */}
                        <button
                            type="button" // Important: type="button" to prevent form submission
                            onClick={startListening}
                            className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${
                                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            aria-label={isListening ? "Stop Listening" : "Start Listening"}
                            disabled={isTyping}
                        >
                            <Mic size={20} />
                        </button>
                        <button
                            type="submit"
                            className="hidden" // Hidden button, submission via Enter key
                            disabled={isTyping || isListening}
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
                /* For Firefox */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #888 #f1f1f1;
                }
            `}</style>
        </div>
    );
}

export default Chatbot;