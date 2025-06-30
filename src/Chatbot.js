import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareText, Send, X, Loader2, Bot, User } from 'lucide-react'; // Icons for UI

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

  // Scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { type: 'bot', text: "Hello! I'm Sheelaa's AI Assistant. How can I help you today? I can tell you about Sheelaa's services, contact details, or her background." }
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = input.trim();
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: data.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: "Oops! Something went wrong. Please try again later or contact Sheelaa directly." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Chatbot container fixed at the bottom right
    <div className="fixed bottom-4 right-4 z-50 font-inter">
      {!isOpen && (
        // Chatbot toggle button
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center"
          aria-label="Open Chatbot"
        >
          <MessageSquareText size={28} />
        </button>
      )}

      {isOpen && (
        // Chatbot window
        <div className="bg-white rounded-xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col overflow-hidden border border-gray-200">
          {/* Chatbot Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between rounded-t-xl shadow-md">
            <div className="flex items-center">
              <Bot size={24} className="mr-2" />
              <h3 className="text-lg font-semibold">Sheelaa AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary/80 p-1 rounded-full transition-colors duration-200"
              aria-label="Close Chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto chat-messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-3 ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {msg.type === 'bot' && <Bot size={16} className="mr-1 text-primary" />}
                    {msg.type === 'user' && <User size={16} className="mr-1 text-white" />}
                    <span className="font-medium text-sm">
                      {msg.type === 'user' ? 'You' : 'Sheelaa Bot'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[75%] p-3 rounded-lg shadow-sm bg-gray-100 text-gray-800 rounded-bl-none flex items-center">
                  <Loader2 size={16} className="animate-spin mr-2 text-primary" />
                  <span className="text-sm">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Scroll target */}
          </div>

          {/* Chat Input Area */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-gray-50 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mr-2 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="Send Message"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
