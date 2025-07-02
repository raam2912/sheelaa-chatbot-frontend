
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareMore, Mic, Volume2, VolumeX, X, Move, Maximize2, Minimize2 } from 'lucide-react';

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
    const [energyOrbs, setEnergyOrbs] = useState([]);
    const [isMaximized, setIsMaximized] = useState(false);
    
    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
    
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null);
    const dragRef = useRef(null);

    // Create enhanced particle system
    useEffect(() => {
        const particleArray = [];
        for (let i = 0; i < 50; i++) {
            particleArray.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 6 + 2,
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 3 + 1,
                direction: Math.random() * 360,
                hue: Math.random() * 60 + 240, // Purple to blue range
            });
        }
        setParticles(particleArray);

        // Create energy orbs
        const orbArray = [];
        for (let i = 0; i < 8; i++) {
            orbArray.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 20 + 10,
                opacity: Math.random() * 0.3 + 0.1,
                speed: Math.random() * 1 + 0.5,
                hue: Math.random() * 120 + 200,
            });
        }
        setEnergyOrbs(orbArray);

        // Enhanced particle animation
        const animateParticles = () => {
            setParticles(prev => prev.map(particle => ({
                ...particle,
                y: (particle.y + particle.speed * 0.15) % 100,
                x: particle.x + Math.sin(Date.now() * 0.002 + particle.id) * 0.2,
                opacity: 0.2 + Math.sin(Date.now() * 0.003 + particle.id) * 0.3,
            })));

            setEnergyOrbs(prev => prev.map(orb => ({
                ...orb,
                x: (orb.x + orb.speed * 0.1) % 100,
                y: orb.y + Math.sin(Date.now() * 0.001 + orb.id) * 0.1,
                opacity: 0.1 + Math.sin(Date.now() * 0.002 + orb.id) * 0.2,
            })));
        };

        const interval = setInterval(animateParticles, 60);
        return () => clearInterval(interval);
    }, []);

    // Handle window resize to keep widget in bounds
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 120),
                y: Math.min(prev.y, window.innerHeight - 120)
            }));
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dragging functionality
    const handleMouseDown = (e) => {
        if (e.target.closest('.no-drag')) return;
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const newX = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 120, e.clientY - dragStart.y));
        
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart, position]);

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

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    const chatSize = isMaximized ? 'w-[90vw] h-[80vh]' : 'w-96 h-[500px]';

    return (
        <>
            {/* Ultra Dynamic Background (only when chat is open) */}
            {isOpen && (
                <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
                    {/* Primary gradient layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-blue-900/30 animate-pulse">
                        {/* Animated mesh gradient */}
                        <div 
                            className="absolute inset-0 opacity-40"
                            style={{
                                background: `
                                    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3) 0%, transparent 50%),
                                    linear-gradient(135deg, rgba(142, 45, 226, 0.2) 0%, rgba(74, 85, 104, 0.2) 100%)
                                `,
                                animation: 'morphGradient 8s ease-in-out infinite alternate'
                            }}
                        />
                    </div>

                    {/* Enhanced particles */}
                    {particles.map((particle) => (
                        <div
                            key={particle.id}
                            className="absolute rounded-full animate-pulse"
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                background: `hsl(${particle.hue}, 70%, 60%)`,
                                opacity: particle.opacity,
                                animation: `float ${3 + particle.id % 4}s ease-in-out infinite, twinkle ${2 + particle.id % 3}s ease-in-out infinite`,
                                animationDelay: `${particle.id * 0.1}s`,
                                boxShadow: `0 0 ${particle.size * 2}px hsl(${particle.hue}, 70%, 60%)`,
                            }}
                        />
                    ))}

                    {/* Energy orbs */}
                    {energyOrbs.map((orb) => (
                        <div
                            key={`orb-${orb.id}`}
                            className="absolute rounded-full blur-sm"
                            style={{
                                left: `${orb.x}%`,
                                top: `${orb.y}%`,
                                width: `${orb.size}px`,
                                height: `${orb.size}px`,
                                background: `radial-gradient(circle, hsl(${orb.hue}, 60%, 50%) 0%, transparent 70%)`,
                                opacity: orb.opacity,
                                animation: `energyFloat ${5 + orb.id % 3}s ease-in-out infinite`,
                                animationDelay: `${orb.id * 0.2}s`,
                            }}
                        />
                    ))}

                    {/* Cosmic dust */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
                </div>
            )}

            <div 
                className="fixed z-50 transition-all duration-300 ease-out"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                ref={dragRef}
                onMouseDown={handleMouseDown}
            >
                {/* Ultra Premium Floating Action Button */}
                <button
                    onClick={toggleChat}
                    className={`
                        relative overflow-hidden group no-drag
                        bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600
                        text-white p-6 rounded-3xl shadow-2xl 
                        hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 
                        focus:outline-none focus:ring-4 focus:ring-purple-300/50
                        transition-all duration-500 ease-out 
                        transform hover:scale-110 hover:rotate-6 active:scale-95
                        flex items-center justify-center
                        ${isOpen ? 'scale-110 rotate-12 shadow-purple-500/50' : 'animate-bounce'}
                        ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                    `}
                    style={{
                        background: `
                            linear-gradient(135deg, 
                                rgba(147, 51, 234, 1) 0%, 
                                rgba(219, 39, 119, 1) 25%, 
                                rgba(59, 130, 246, 1) 50%,
                                rgba(147, 51, 234, 1) 75%,
                                rgba(219, 39, 119, 1) 100%
                            )`,
                        backgroundSize: '300% 300%',
                        animation: isOpen ? 'none' : 'gradientShift 4s ease infinite, bounce 2s infinite, pulse 3s ease-in-out infinite',
                        boxShadow: `
                            0 20px 40px rgba(147, 51, 234, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2),
                            0 0 0 0 rgba(147, 51, 234, 0.7)
                        `,
                        width: '80px',
                        height: '80px'
                    }}
                    aria-label="Toggle Chat"
                >
                    {/* Multiple shimmer effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-45 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-pink-300/20 to-transparent transform -rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1200"></div>
                    
                    <MessageSquareMore size={36} className={`transition-all duration-500 z-10 relative ${isOpen ? 'rotate-180 scale-110' : ''}`} />
                    
                    {/* Multiple pulse rings */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 animate-ping opacity-30"></div>
                    <div className="absolute inset-0 rounded-3xl border border-pink-300/50 animate-pulse"></div>
                    <div className="absolute -inset-2 rounded-3xl border border-indigo-300/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>

                    {/* Energy field */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
                </button>

                {/* Revolutionary Chat Window */}
                {isOpen && (
                    <div 
                        ref={chatContainerRef}
                        className={`absolute ${isMaximized ? 'bottom-24 right-0' : 'bottom-24 right-0'} ${chatSize} transform transition-all duration-700 ease-out no-drag`}
                        style={{
                            animation: 'quantumSlide 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            filter: 'drop-shadow(0 25px 50px rgba(147, 51, 234, 0.3))'
                        }}
                    >
                        <div className="w-full h-full relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/20">
                            {/* Ultra dynamic background */}
                            <div 
                                className="absolute inset-0 opacity-95"
                                style={{
                                    background: `
                                        linear-gradient(135deg, 
                                            rgba(255, 255, 255, 0.95) 0%,
                                            rgba(248, 250, 252, 0.98) 25%,
                                            rgba(241, 245, 249, 0.95) 50%,
                                            rgba(255, 255, 255, 0.98) 75%,
                                            rgba(248, 250, 252, 0.95) 100%
                                        )`,
                                    backgroundSize: '400% 400%',
                                    animation: 'gradientShift 6s ease infinite'
                                }}
                            />

                            {/* Animated header background */}
                            <div className="absolute top-0 left-0 w-full h-28 overflow-hidden rounded-t-3xl">
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        background: `
                                            linear-gradient(135deg, 
                                                rgba(147, 51, 234, 1) 0%, 
                                                rgba(219, 39, 119, 0.9) 25%, 
                                                rgba(59, 130, 246, 0.9) 50%,
                                                rgba(147, 51, 234, 0.9) 75%,
                                                rgba(219, 39, 119, 1) 100%
                                            )`,
                                        backgroundSize: '300% 300%',
                                        animation: 'gradientShift 4s ease infinite'
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                
                                {/* Cosmic pattern overlay */}
                                <div className="absolute inset-0 opacity-30">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute rounded-full bg-white/30"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                width: `${Math.random() * 4 + 2}px`,
                                                height: `${Math.random() * 4 + 2}px`,
                                                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                                                animationDelay: `${Math.random() * 2}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Premium Chat Header */}
                            <div className="relative text-white p-6 flex justify-between items-center rounded-t-3xl z-10">
                                <div className="flex items-center space-x-4">
                                    {/* Ultra Premium Avatar */}
                                    <div className="relative">
                                        <div 
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl relative overflow-hidden"
                                            style={{
                                                background: `
                                                    linear-gradient(135deg, 
                                                        rgba(236, 72, 153, 1) 0%, 
                                                        rgba(168, 85, 247, 1) 50%,
                                                        rgba(59, 130, 246, 1) 100%
                                                    )`,
                                                animation: 'pulse 2s ease-in-out infinite'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                            🤖
                                        </div>
                                        
                                        {/* Multiple rotating rings */}
                                        <div className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-spin" style={{ animationDuration: '4s' }}></div>
                                        <div className="absolute -inset-1 rounded-2xl border border-white/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                                        <div className="absolute -inset-2 rounded-2xl border border-white/20 animate-ping"></div>
                                        
                                        {/* Energy field */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-400/30 to-blue-400/30 blur-lg animate-pulse"></div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-bold text-xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                            Sheelaa AI Assistant
                                        </h3>
                                        <div className="flex items-center space-x-2 text-sm text-white/90">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                            <span className="font-medium">Quantum Neural Network Active</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    {/* Maximize/Minimize Button */}
                                    <button
                                        onClick={toggleMaximize}
                                        className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-110 active:scale-95 no-drag"
                                        aria-label={isMaximized ? "Minimize" : "Maximize"}
                                    >
                                        {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                    </button>

                                    {/* Enhanced Voice Toggle */}
                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-110 active:scale-95 relative overflow-hidden no-drag"
                                        aria-label={voiceEnabled ? "Disable Voice Reply" : "Enable Voice Reply"}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full hover:translate-x-[-100%] transition-transform duration-500"></div>
                                        <div className="relative z-10">
                                            {voiceEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                                        </div>
                                        {voiceEnabled && (
                                            <>
                                                <div className="absolute -inset-1 border border-white/30 rounded-xl animate-pulse"></div>
                                                <div className="absolute inset-0 bg-green-400/20 rounded-xl animate-pulse"></div>
                                            </>
                                        )}
                                    </button>
                                    
                                    {/* Enhanced Close Button */}
                                    <button
                                        onClick={toggleChat}
                                        className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-110 hover:rotate-90 active:scale-95 relative overflow-hidden no-drag"
                                        aria-label="Close Chat"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full hover:translate-x-[-100%] transition-transform duration-500"></div>
                                        <X size={22} className="relative z-10" />
                                    </button>
                                </div>
                            </div>

                            {/* Ultra Premium Messages Area */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative" style={{ height: 'calc(100% - 180px)' }}>
                                {/* Subtle background pattern */}
                                <div className="absolute inset-0 opacity-30 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50"></div>
                                </div>

                                <div className="relative z-10">
                                    {messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`mb-6 transform transition-all duration-500 hover:scale-[1.02] ${
                                                msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'
                                            }`}
                                            style={{
                                                animation: `messageQuantum 0.6s ease-out ${index * 0.1}s both`,
                                            }}
                                        >
                                            <div className={`flex items-start space-x-3 max-w-[85%] ${
                                                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                            }`}>
                                                {msg.sender === 'bot' && (
                                                    <div 
                                                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm flex-shrink-0 shadow-lg relative overflow-hidden"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(147, 51, 234, 1) 0%, rgba(59, 130, 246, 1) 100%)',
                                                            animation: 'pulse 2s ease-in-out infinite'
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                                                        🤖
                                                    </div>
                                                )}
                                                
                                                <div className={`
                                                    relative p-5 rounded-3xl shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl group overflow-hidden
                                                    ${msg.sender === 'user'
                                                        ? 'text-white rounded-br-lg'
                                                        : 'text-gray-800 rounded-bl-lg border border-purple-100/50'
                                                    }
                                                `}
                                                style={{
                                                    background: msg.sender === 'user' 
                                                        ? 'linear-gradient(135deg, rgba(147, 51, 234, 1) 0%, rgba(219, 39, 119, 0.9) 50%, rgba(59, 130, 246, 0.9) 100%)'
                                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 50%, rgba(255, 255, 255, 0.95) 100%)',
                                                    backgroundSize: '200% 200%',
                                                    animation: msg.sender === 'user' ? 'gradientShift 3s ease infinite' : 'none'
                                                }}
                                                >
                                                    {/* Enhanced message shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000 rounded-3xl"></div>
                                                    
                                                    <p className="text-sm leading-relaxed relative z-10 font-medium">{msg.text}</p>
                                                    
                                                    {/* Enhanced message tail */}
                                                    <div className={`absolute top-6 w-0 h-0 ${
                                                        msg.sender === 'user'
                                                            ? 'right-0 border-l-12 border-l-purple-600 border-t-6 border-t-transparent border-b-6 border-b-transparent'
                                                            : 'left-0 border-r-12 border-r-white/90 border-t-6 border-t-transparent border-b-6 border-b-transparent'
                                                    }`}></div>

                                                    {/* Message glow effect */}
                                                    {msg.sender === 'user' && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-lg -z-10"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Ultra Enhanced Typing Indicator */}
                                    {isTyping && (
                                        <div className="flex justify-start mb-6 animate-in slide-in-from-left-2">
                                            <div className="flex items-start space-x-3 max-w-[85%]">
                                                <div 
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg relative overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(147, 51, 234, 1) 0%, rgba(59, 130, 246, 1) 100%)',
                                                        animation: 'bounce 1s ease-in-out infinite'
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                                                    🤖
                                                </div>
                                                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl rounded-bl-lg shadow-xl border border-purple-100/50 flex items-center space-x-3 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 animate-pulse"></div>
                                                    <div className="flex space-x-2 relative z-10">
                                                        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
                                                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-700 ml-3 font-medium relative z-10">Quantum processing...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Ultra Enhanced Speaking Indicator */}
                                    {isSpeaking && (
                                        <div className="flex justify-start mb-6 animate-in slide-in-from-left-2">
                                            <div className="flex items-start space-x-3 max-w-[85%]">
                                                <div 
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg relative overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 1) 0%, rgba(59, 130, 246, 1) 100%)',
                                                        animation: 'pulse 1.5s ease-in-out infinite'
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                                                    🔊
                                                </div>
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm p-5 rounded-3xl rounded-bl-lg shadow-xl border border-green-200/50 flex items-center space-x-3 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 animate-pulse"></div>
                                                    <div className="flex space-x-1 relative z-10">
                                                        <div className="w-1 h-6 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0ms' }}></div>
                                                        <div className="w-1 h-8 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '100ms' }}></div>
                                                        <div className="w-1 h-4 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '200ms' }}></div>
                                                        <div className="w-1 h-7 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '300ms' }}></div>
                                                        <div className="w-1 h-5 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '400ms' }}></div>
                                                    </div>
                                                    <span className="text-sm text-green-700 ml-3 font-medium relative z-10">Neural voice synthesis...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Revolutionary Input Area */}
                            <form onSubmit={handleSubmit} className="p-6 relative z-10">
                                <div className={`
                                    flex items-center space-x-4 rounded-3xl shadow-2xl border transition-all duration-500 p-3 relative overflow-hidden
                                    ${isListening 
                                        ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 animate-pulse shadow-red-500/25' 
                                        : 'border-white/30 bg-white/90 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] focus-within:shadow-2xl focus-within:border-purple-300 focus-within:bg-white/95'
                                    }
                                `}>
                                    {/* Background gradient animation */}
                                    <div 
                                        className="absolute inset-0 opacity-30"
                                        style={{
                                            background: isListening 
                                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
                                                : 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                            backgroundSize: '200% 200%',
                                            animation: 'gradientShift 3s ease infinite'
                                        }}
                                    />

                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder={isListening ? "🎤 Neural interface active..." : "Type your quantum query..."}
                                        className="flex-1 p-4 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium text-sm relative z-10"
                                        disabled={isTyping || isListening}
                                    />
                                    
                                    {/* Ultra Enhanced Microphone Button */}
                                    <button
                                        type="button"
                                        onClick={startListening}
                                        className={`
                                            relative overflow-hidden p-4 rounded-2xl transition-all duration-500 
                                            focus:outline-none focus:ring-2 transform hover:scale-110 active:scale-95 group
                                            ${isListening 
                                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse focus:ring-red-300 shadow-lg shadow-red-500/25' 
                                                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 focus:ring-purple-300 shadow-lg shadow-purple-500/25'
                                            }
                                        `}
                                        style={{
                                            backgroundSize: '200% 200%',
                                            animation: isListening ? 'pulse 1s ease-in-out infinite' : 'gradientShift 3s ease infinite'
                                        }}
                                        aria-label={isListening ? "Stop Neural Interface" : "Activate Neural Interface"}
                                        disabled={isTyping}
                                    >
                                        {/* Enhanced button shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                                        
                                        <Mic size={24} className={`relative z-10 ${isListening ? 'animate-bounce' : ''}`} />
                                        
                                        {isListening && (
                                            <>
                                                <div className="absolute inset-0 border-2 border-red-300 rounded-2xl animate-ping"></div>
                                                <div className="absolute -inset-1 border border-red-400 rounded-2xl animate-pulse"></div>
                                            </>
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

            {/* Ultra Enhanced Custom Styles */}
            <style jsx>{`
                @keyframes quantumSlide {
                    from {
                        opacity: 0;
                        transform: translateY(60px) scale(0.8) rotateX(15deg);
                        filter: blur(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1) rotateX(0deg);
                        filter: blur(0px);
                    }
                }

                @keyframes messageQuantum {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.9);
                        filter: blur(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0px);
                    }
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes morphGradient {
                    0% {
                        background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                                   radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                                   radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3) 0%, transparent 50%);
                    }
                    50% {
                        background: radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.4) 0%, transparent 50%),
                                   radial-gradient(circle at 20% 80%, rgba(119, 198, 255, 0.4) 0%, transparent 50%),
                                   radial-gradient(circle at 60% 30%, rgba(120, 119, 198, 0.4) 0%, transparent 50%);
                    }
                    100% {
                        background: radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3) 0%, transparent 50%),
                                   radial-gradient(circle at 70% 10%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                                   radial-gradient(circle at 10% 40%, rgba(255, 119, 198, 0.3) 0%, transparent 50%);
                    }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
                    25% { transform: translateY(-15px) rotate(90deg) scale(1.1); }
                    50% { transform: translateY(-5px) rotate(180deg) scale(0.9); }
                    75% { transform: translateY(-10px) rotate(270deg) scale(1.05); }
                }

                @keyframes energyFloat {
                    0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0.1; }
                    33% { transform: translateY(-20px) scale(1.2) rotate(120deg); opacity: 0.3; }
                    66% { transform: translateY(-10px) scale(0.8) rotate(240deg); opacity: 0.2; }
                }

                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(300%) skewX(-12deg); }
                }

                .animate-shimmer {
                    animation: shimmer 4s linear infinite;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, rgb(147, 51, 234), rgb(219, 39, 119), rgb(59, 130, 246));
                    border-radius: 10px;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, rgb(124, 58, 237), rgb(190, 24, 93), rgb(37, 99, 235));
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgb(147, 51, 234) rgba(0, 0, 0, 0.05);
                }

                .no-drag {
                    cursor: default !important;
                }

                /* Ultra smooth drag cursor */
                .dragging {
                    cursor: grabbing !important;
                    user-select: none;
                }

                /* Enhanced glow effects */
                .glow-purple {
                    box-shadow: 0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.3), 0 0 60px rgba(147, 51, 234, 0.1);
                }

                .glow-pink {
                    box-shadow: 0 0 20px rgba(219, 39, 119, 0.5), 0 0 40px rgba(219, 39, 119, 0.3), 0 0 60px rgba(219, 39, 119, 0.1);
                }

                /* Ultra premium transitions */
                * {
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Quantum blur effect */
                .quantum-blur {
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                }
            `}</style>
        </>
    );
}

export default Chatbot;