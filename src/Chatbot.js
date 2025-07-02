import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { MessageSquareMore, Mic, Volume2, VolumeX, X, Maximize2, Minimize2 } from 'lucide-react'; // Removed 'Move'

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

    // NEW: States for advanced UI (particles, energy orbs, maximize, drag)
    const [particles, setParticles] = useState([]);
    const [energyOrbs, setEnergyOrbs] = useState([]);
    const [isMaximized, setIsMaximized] = useState(false);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isAnimating, setIsAnimating] = useState(false); // Prevents rapid toggling/dragging during animation

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null); // Ref for the chat window for position calculation
    const dragRef = useRef(null); // Ref for the draggable button container

    // Initialize position of the widget
    useEffect(() => {
        // Set initial position to bottom right, adjusted for button size
        const buttonSize = 80; // Defined here for consistent use
        setPosition({
            x: window.innerWidth - buttonSize - 20, // buttonSize px width, 20px right margin
            y: window.innerHeight - buttonSize - 20 // buttonSize px height, 20px bottom margin
        });
    }, []);

    // Create enhanced particle system and energy orbs for background animation
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
            const buttonSize = 80;
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - buttonSize),
                y: Math.min(prev.y, window.innerHeight - buttonSize)
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dragging functionality
    const handleMouseDown = (e) => {
        // Prevent drag if click is on a no-drag element (like buttons inside chat)
        if (e.target.closest('.no-drag')) return;
        // Prevent dragging when chat is open or animating
        if (isOpen || isAnimating) return;

        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent interference with other elements
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Use useCallback for handleMouseMove to make it a stable dependency
    const handleMouseMove = useCallback((e) => {
        // Prevent drag if not dragging, or if chat is open/animating
        if (!isDragging || isOpen || isAnimating) return;

        e.preventDefault();
        const buttonSize = 80; // Use buttonSize here
        const newX = Math.max(0, Math.min(window.innerWidth - buttonSize, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - buttonSize, e.clientY - dragStart.y));

        setPosition({ x: newX, y: newY });
    }, [isDragging, isOpen, isAnimating, dragStart, position]); // Added position to dependencies

    // Use useCallback for handleMouseUp to make it a stable dependency
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        // Only add listeners if actively dragging and not open/animating
        if (isDragging && !isOpen && !isAnimating) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none'; // Prevent text selection during drag
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = ''; // Re-enable text selection
            };
        }
    }, [isDragging, isOpen, isAnimating, handleMouseMove, handleMouseUp]); // Dependencies now include handleMouseMove and handleMouseUp

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

    // Use useCallback for speakText to make it a stable dependency
    const speakText = useCallback((text) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) {
            console.warn('Text-to-speech not enabled or not supported.');
            return;
        }

        speechSynthesis.cancel();
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Default language for TTS
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance error:', event);
            setIsSpeaking(false);
        };
        speechSynthesis.speak(utterance);
    }, [voiceEnabled]); // speakText depends on voiceEnabled

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
    }, [isOpen, messages.length, voiceEnabled, speakText]); // Now speakText is a stable dependency

    // Toggle Chat function with animation prevention and cleanup
    const toggleChat = () => {
        if (isAnimating) return; // Prevent rapid toggling during animation

        setIsAnimating(true); // Start animation flag

        if (isOpen) {
            // Closing chat - cleanup first
            if (isListening) {
                recognitionRef.current?.stop();
            }
            if (isSpeaking) {
                speechSynthesis.cancel();
                setIsSpeaking(false);
            }
            setIsMaximized(false); // Reset maximized state when closing
        }

        setIsOpen(!isOpen);

        // Reset animation flag after animation completes (matches CSS animation duration)
        setTimeout(() => {
            setIsAnimating(false);
        }, 800); // Matches quantumSlide animation duration
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

    // Calculate chat position and size (updated for fullscreen layout)
    const getChatPosition = () => {
        if (isMaximized) {
            return {
                position: 'fixed',
                top: '2vh',          // Reduced from 5vh
                left: '2vw',         // Reduced from 5vw
                width: '96vw',       // Increased from 90vw
                height: '96vh',      // Increased from 90vh
                transform: 'none',
                zIndex: 9999         // Ensure it's on top
            };
        } else {
            // Calculate position relative to button
            const chatWidth = 384; // w-96 = 384px
            const chatHeight = 500; // h-[500px]
            const buttonSize = 80; // w-20 / h-20 for the button (used consistently)

            let chatX = position.x;
            let chatY = position.y - chatHeight - 20; // 20px margin above button

            // Adjust if chat would go off screen (relative to widget button)
            if (chatX + chatWidth > window.innerWidth) {
                chatX = window.innerWidth - chatWidth - 20; // 20px from right edge
            }
            if (chatX < 20) { // 20px from left edge
                chatX = 20;
            }
            if (chatY < 20) { // 20px from top edge
                chatY = 20;
            }
            if (chatY + chatHeight > window.innerHeight) {
                chatY = window.innerHeight - chatHeight - 20; // 20px from bottom edge
            }

            return {
                position: 'fixed',
                left: `${chatX}px`,
                top: `${chatY}px`,
                width: '384px',
                height: '500px',
                transform: 'none'
            };
        }
    };

    const chatPositionStyle = getChatPosition();

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

            {/* Widget Container (draggable button) */}
            <div
                className="fixed z-50 transition-all duration-300 ease-out"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : (isOpen ? 'default' : 'grab'),
                    pointerEvents: isAnimating ? 'none' : 'auto' // Disable pointer events during animation
                }}
                ref={dragRef}
                onMouseDown={handleMouseDown}
            >
                {/* Ultra Premium Floating Action Button */}
                <button
                    onClick={toggleChat}
                    disabled={isAnimating} // Disable button during animation
                    className={`
                        relative overflow-hidden group no-drag
                        bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600
                        text-white rounded-3xl shadow-2xl
                        hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700
                        focus:outline-none focus:ring-4 focus:ring-purple-300/50
                        transition-all duration-500 ease-out
                        transform hover:scale-110 hover:rotate-6 active:scale-95
                        flex items-center justify-center
                        ${isOpen ? 'scale-110 rotate-12 shadow-purple-500/50' : 'animate-bounce'}
                        ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                        ${isAnimating ? 'pointer-events-none' : ''}
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
            </div>

            {/* Revolutionary Chat Window */}
            {isOpen && (
                <div
                    ref={chatContainerRef}
                    className="fixed z-50 no-drag"
                    style={{
                        ...chatPositionStyle,
                        animation: 'quantumSlide 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        filter: 'drop-shadow(0 25px 50px rgba(147, 51, 234, 0.3))'
                    }}
                >
                    <div className="w-full h-full relative overflow-hidden rounded-3xl backdrop-blur-xl border border-white/20 flex flex-col">
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
                        <div className="relative text-white p-6 flex justify-between items-center rounded-t-3xl z-10 flex-shrink-0">
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

                        {/* Ultra Premium Messages Area (flex-1 with min-h-0 for proper scrolling) */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative min-h-0">
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
                                        style={{ animation: `slideInMessage 0.5s ease-out ${index * 0.1}s both`
                                        }}
                                    >
                                        <div
                                            className={`relative max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                                                msg.sender === 'user'
                                                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white ml-4'
                                                    : 'bg-white/90 backdrop-blur-sm text-gray-800 mr-4 border border-gray-200/50'
                                            }`}
                                            style={{
                                                boxShadow: msg.sender === 'user'
                                                    ? '0 10px 25px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                                    : '0 10px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                            }}
                                        >
                                            {msg.sender === 'user' && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full hover:translate-x-[-100%] transition-transform duration-700 rounded-2xl"></div>
                                            )}

                                            <div className="relative z-10">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            </div>

                                            {/* Message tail */}
                                            <div
                                                className={`absolute w-4 h-4 ${
                                                    msg.sender === 'user'
                                                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 -right-2 top-4 transform rotate-45'
                                                        : 'bg-white/90 -left-2 top-4 transform rotate-45 border-l border-b border-gray-200/50'
                                                }`}
                                            ></div>
                                        </div>
                                    </div>
                                ))}

                                {/* Ultra Premium Typing Indicator */}
                                {isTyping && (
                                    <div className="mb-6 flex justify-start transform animate-slideInLeft">
                                        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 mr-4 shadow-lg relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 animate-pulse"></div>
                                            <div className="flex items-center space-x-2 relative z-10">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
                                            </div>

                                            {/* Typing indicator tail */}
                                            <div className="absolute w-4 h-4 bg-white/90 -left-2 top-4 transform rotate-45 border-l border-b border-gray-200/50"></div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Revolutionary Input Area (flex-shrink-0) */}
                        <div className="relative p-6 border-t border-white/30 backdrop-blur-sm flex-shrink-0">
                            {/* Animated input background */}
                            <div
                                className="absolute inset-0 opacity-50"
                                style={{
                                    background: `
                                        linear-gradient(135deg,
                                            rgba(255, 255, 255, 0.9) 0%,
                                            rgba(248, 250, 252, 0.95) 50%,
                                            rgba(255, 255, 255, 0.9) 100%
                                        )`,
                                    backgroundSize: '200% 200%',
                                    animation: 'gradientShift 3s ease infinite'
                                }}
                            />

                            <form onSubmit={handleSubmit} className="relative z-10">
                                <div className="flex items-center space-x-4">
                                    {/* Ultra Premium Input Field */}
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder="Type your message..."
                                            className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl focus:bg-white/90"
                                            style={{
                                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                                            }}
                                            disabled={isTyping}
                                        />

                                        {/* Input focus ring */}
                                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 transition-opacity duration-300 focus-within:opacity-100 -z-10" style={{ padding: '2px' }}>
                                            <div className="w-full h-full bg-white rounded-2xl"></div>
                                        </div>
                                    </div>

                                    {/* Enhanced Voice Input Button */}
                                    <button
                                        type="button"
                                        onClick={startListening}
                                        disabled={isTyping}
                                        className={`p-4 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300/50 transform hover:scale-110 active:scale-95 relative overflow-hidden shadow-lg hover:shadow-xl ${
                                            isListening
                                                ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white animate-pulse'
                                                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-purple-100 hover:to-pink-100 hover:text-purple-600'
                                        }`}
                                        aria-label={isListening ? "Stop Listening" : "Start Voice Input"}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full hover:translate-x-[-100%] transition-transform duration-500"></div>
                                        <Mic size={20} className="relative z-10" />

                                        {isListening && (
                                            <>
                                                <div className="absolute inset-0 border-2 border-red-300 rounded-2xl animate-ping"></div>
                                                <div className="absolute -inset-1 border border-red-200 rounded-2xl animate-pulse"></div>
                                            </>
                                        )}
                                    </button>

                                    {/* Revolutionary Send Button */}
                                    <button
                                        type="submit"
                                        disabled={isTyping || input.trim() === ''}
                                        className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300/50 transform hover:scale-105 active:scale-95 relative overflow-hidden shadow-lg hover:shadow-xl ${
                                            isTyping || input.trim() === ''
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                                        }`}
                                        style={{
                                            boxShadow: isTyping || input.trim() === ''
                                                ? '0 8px 25px rgba(0, 0, 0, 0.1)'
                                                : '0 8px 25px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full hover:translate-x-[-100%] transition-transform duration-700"></div>
                                        <span className="relative z-10">
                                            {isTyping ? 'Sending...' : 'Send'}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Custom Styles (CSS Animations) */}
            <style jsx>{`
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes quantumSlide {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(20px) rotateX(10deg);
                        filter: blur(10px);
                    }
                    60% {
                        opacity: 0.8;
                        transform: scale(1.05) translateY(-5px) rotateX(-2deg);
                        filter: blur(2px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0) rotateX(0deg);
                        filter: blur(0px);
                    }
                }

                @keyframes slideInMessage {
                    0% {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes slideInLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                @keyframes morphGradient {
                    0%, 100% {
                        background-position: 0% 50%;
                        filter: hue-rotate(0deg);
                    }
                    50% {
                        background-position: 100% 50%;
                        filter: hue-rotate(45deg);
                    }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }

                @keyframes energyFloat {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    33% { transform: translateY(-10px) scale(1.1); }
                    66% { transform: translateY(5px) scale(0.9); }
                }

                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }

                /* Custom Scrollbar Styles */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(147, 51, 234, 0.3) transparent;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, rgba(147, 51, 234, 0.5), rgba(219, 39, 119, 0.5));
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(219, 39, 119, 0.8));
                }
            `}</style>
        </>
    );
}

export default Chatbot;
