import React from 'react';
import Chatbot from './Chatbot'; // Assuming Chatbot.js is in the same directory
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Render your website content components here */}
        <Home />
        <About />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <Chatbot /> {/* The chatbot component */}
    </div>
  );
}

export default App;
