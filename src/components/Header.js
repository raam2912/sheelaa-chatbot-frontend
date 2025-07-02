import React from 'react';

function Header() {
  return (
    <header className="bg-purple-600 text-white p-4 text-center shadow-md">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-2">Sheelaa AI Assistant Demo</h1>
        <nav>
          <ul className="flex justify-center space-x-6">
            <li><a href="#home" className="hover:text-purple-200 transition-colors duration-200">Home</a></li>
            <li><a href="#about" className="hover:text-purple-200 transition-colors duration-200">About Sheelaa</a></li>
            <li><a href="#services" className="hover:text-purple-200 transition-colors duration-200">Services</a></li>
            <li><a href="#testimonials" className="hover:text-purple-200 transition-colors duration-200">Testimonials</a></li>
            <li><a href="#contact" className="hover:text-purple-200 transition-colors duration-200">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;

