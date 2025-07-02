import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareMore, Mic, Volume2, VolumeX, X } from 'lucide-react';

// IMPORTANT: Hardcoded the Render backend URL for GitHub Pages deployment.
const BACKEND_URL = 'https://sheelaa-chatbot-backend.onrender.com';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [particles, setParticles] = useState([]);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Create animated particles
    useEffect(() => {
        const particleArray = [];
        for (let i = 0; i < 30; i++) {
            particleArray.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 4 + 2,
                opacity: Math.random() * 0.5 + 0.1,
                speed: Math.random() * 2 + 1,
                direction: Math.random() * 360,
            });
        }
        setParticles(particleArray);

        // Animate particles
        const animateParticles = () => {
            setParticles(prev => prev.map(particle => ({
                ...particle,
                y: (particle.y + particle.speed * 0.1) % 100,
                x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.1,
            })));
        };

        const interval = setInterval(animateParticles, 50);
        return () => clearInterval(interval);
    }, []);

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
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                console.log('Voice recognition started.');
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                console.log('Transcript:', transcript);
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
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (speechSynthesis) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    // Initial welcome message and automatic voice reply
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = { 
                sender: 'bot', 
                text: "Hello! I'm Sheelaa's AI Assistant. How can I help you today? I can tell you about Sheelaa's services, contact details, or her background." 
            };
            setMessages([welcomeMessage]);
            if (voiceEnabled) {
                speakText(welcomeMessage.text);
            }
        }
    }, [isOpen, messages.length, voiceEnabled]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (isOpen && isListening) {
            recognitionRef.current?.stop();
        }
        if (isOpen && isSpeaking) {
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

        speechSynthesis.cancel();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
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
        if (isSpeaking) {
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
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        } else {
            alert('Speech recognition not supported in your browser.');
        }
    };

    return (
        <>
            {/* Animated Background (only when chat is open) */}
            {isOpen && (
                <div className="fixed inset-0 pointer-events-none z-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-blue-600/20">
                        {particles.map((particle) => (
                            <div
                                key={particle.id}
                                className="absolute rounded-full bg-white/20 animate-pulse"
                                style={{
                                    left: `${particle.x}%`,
                                    top: `${particle.y}%`,
                                    width: `${particle.size}px`,
                                    height: `${particle.size}px`,
                                    opacity: particle.opacity,
                                    animation: `float ${3 + particle.id % 3}s ease-in-out infinite`,
                                    animationDelay: `${particle.id * 0.1}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="fixed bottom-4 right-4 z-50">
                {/* Floating Action Button with Enhanced Animation */}
                <button
                    onClick={toggleChat}
                    className={`
                        relative overflow-hidden
                        bg-gradient-to-r from-purple-600 to-indigo-600 
                        text-white p-4 rounded-full shadow-2xl 
                        hover:from-purple-700 hover:to-indigo-700 
                        focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-75 
                        transition-all duration-500 ease-in-out 
                        transform hover:scale-110 hover:rotate-12
                        flex items-center justify-center
                        group animate-bounce
                        ${isOpen ? 'scale-110 rotate-45' : ''}
                    `}
                    style={{
                        animation: isOpen ? 'none' : 'bounce 2s infinite, pulse 3s ease-in-out infinite',
                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3), 0 0 0 0 rgba(139, 92, 246, 0.7)',
                    }}
                    aria-label="Toggle Chat"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-45 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700"></div>
                    
                    <MessageSquareMore size={30} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    
                    {/* Pulse rings */}
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border border-purple-300 animate-pulse"></div>
                </button>

                {/* Enhanced Chat Window */}
                {isOpen && (
                    <div 
                        ref={chatContainerRef}
                        className="fixed bottom-20 right-4 w-96 h-[500px] transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-5 scale-in-95"
                        style={{
                            animation: 'slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                    >
                        <div className="w-full h-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/20 relative">
                            {/* Animated header background */}
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 opacity-90">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                            </div>

                            {/* Chat Header */}
                            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-2xl shadow-lg z-10">
                                <div className="flex items-center space-x-3">
                                    {/* Animated Avatar */}
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center text-lg animate-pulse shadow-lg">
                                            🤖
                                        </div>
                                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin" style={{ animationDuration: '3s' }}></div>
                                        <div className="absolute -inset-1 rounded-full border border-white/20 animate-ping"></div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-lg">Sheelaa AI Assistant</h3>
                                        <div className="flex items-center space-x-1 text-xs text-white/80">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span>Online & Ready</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {/* Enhanced Voice Toggle */}
                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-110 active:scale-95"
                                        aria-label={voiceEnabled ? "Disable Voice Reply" : "Enable Voice Reply"}
                                    >
                                        <div className="relative">
                                            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                            {voiceEnabled && (
                                                <div className="absolute -inset-1 border border-white/30 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                    </button>
                                    
                                    {/* Enhanced Close Button */}
                                    <button
                                        onClick={toggleChat}
                                        className="p-2 rounded-full hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-110 hover:rotate-90 active:scale-95"
                                        aria-label="Close Chat"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages Area with Enhanced Styling */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-purple-50/30 custom-scrollbar">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`mb-4 transform transition-all duration-500 hover:scale-[1.02] ${
                                            msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'
                                        }`}
                                        style={{
                                            animation: `messageSlide 0.5s ease-out ${index * 0.1}s both`,
                                        }}
                                    >
                                        <div className={`flex items-start space-x-2 max-w-[85%] ${
                                            msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                        }`}>
                                            {msg.sender === 'bot' && (
                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 animate-pulse">
                                                    🤖
                                                </div>
                                            )}
                                            
                                            <div className={`
                                                relative p-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl
                                                ${msg.sender === 'user'
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
                                                    : 'bg-white/80 text-gray-800 rounded-bl-md border border-purple-100'
                                                }
                                            `}>
                                                {/* Message shine effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700 rounded-2xl"></div>
                                                
                                                <p className="text-sm leading-relaxed relative z-10">{msg.text}</p>
                                                
                                                {/* Message tail */}
                                                <div className={`absolute top-4 w-0 h-0 ${
                                                    msg.sender === 'user'
                                                        ? 'right-0 border-l-8 border-l-purple-600 border-t-4 border-t-transparent border-b-4 border-b-transparent'
                                                        : 'left-0 border-r-8 border-r-white/80 border-t-4 border-t-transparent border-b-4 border-b-transparent'
                                                }`}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Enhanced Typing Indicator */}
                                {isTyping && (
                                    <div className="flex justify-start mb-4 animate-in slide-in-from-left-2">
                                        <div className="flex items-start space-x-2 max-w-[85%]">
                                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm animate-bounce">
                                                🤖
                                            </div>
                                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl rounded-bl-md shadow-lg border border-purple-100 flex items-center space-x-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-gray-600 ml-2">Sheelaa is thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Speaking Indicator */}
                                {isSpeaking && (
                                    <div className="flex justify-start mb-4 animate-in slide-in-from-left-2">
                                        <div className="flex items-start space-x-2 max-w-[85%]">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm animate-pulse">
                                                🔊
                                            </div>
                                            <div className="bg-green-50 backdrop-blur-sm p-4 rounded-2xl rounded-bl-md shadow-lg border border-green-200 flex items-center space-x-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-1 h-4 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-1 h-6 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                                                    <div className="w-1 h-3 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                                    <div className="w-1 h-5 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-green-700 ml-2">Speaking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Enhanced Input Area */}
                            <form onSubmit={handleSubmit} className="p-4 bg-white/90 backdrop-blur-xl border-t border-white/20">
                                <div className={`
                                    flex items-center space-x-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-2
                                    transition-all duration-300 focus-within:shadow-xl focus-within:border-purple-300 focus-within:bg-white
                                    hover:shadow-lg hover:scale-[1.02]
                                    ${isListening ? 'border-red-300 bg-red-50 animate-pulse' : ''}
                                `}>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder={isListening ? "🎤 Listening..." : "Type your message..."}
                                        className="flex-1 p-3 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
                                        disabled={isTyping || isListening}
                                    />
                                    
                                    {/* Enhanced Microphone Button */}
                                    <button
                                        type="button"
                                        onClick={startListening}
                                        className={`
                                            relative overflow-hidden p-3 rounded-xl transition-all duration-300 
                                            focus:outline-none focus:ring-2 transform hover:scale-110 active:scale-95
                                            ${isListening 
                                                ? 'bg-red-500 text-white animate-pulse focus:ring-red-300 shadow-lg' 
                                                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 focus:ring-purple-300 shadow-md'
                                            }
                                        `}
                                        aria-label={isListening ? "Stop Listening" : "Start Listening"}
                                        disabled={isTyping}
                                    >
                                        {/* Button shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full hover:translate-x-[-100%] transition-transform duration-500"></div>
                                        
                                        <Mic size={20} className={`relative z-10 ${isListening ? 'animate-bounce' : ''}`} />
                                        
                                        {isListening && (
                                            <div className="absolute inset-0 border-2 border-red-300 rounded-xl animate-ping"></div>
                                        )}
                                    </button>
                                    
                                    <button type="submit" className="hidden" disabled={isTyping || isListening}>
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Custom Styles */}
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(50px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(180deg); }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }

                .animate-shimmer {
                    animation: shimmer 3s linear infinite;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, rgb(139, 92, 246), rgb(59, 130, 246));
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, rgb(124, 58, 237), rgb(37, 99, 235));
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgb(139, 92, 246) rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </>
    );
}
export default Chatbot;