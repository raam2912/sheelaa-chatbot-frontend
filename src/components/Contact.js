import React from 'react';

function Contact() {
  return (
    <section id="contact" className="bg-white p-8 rounded-lg shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 border-b-2 border-purple-300 pb-2">Contact Us</h2>
      <p className="text-gray-700 leading-relaxed mb-4">For consultations and inquiries, please reach out:</p>
      <ul className="list-disc list-inside ml-4 text-gray-700">
        <li className="mb-2">Email: info@sheelaa.com</li>
        <li className="mb-2">Phone: +91 98765 43210</li>
        <li>Address: 123 Spiritual Path, Harmony City, India</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mt-4">We look forward to assisting you on your journey.</p>
    </section>
  );
}

export default Contact;

