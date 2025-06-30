import React from 'react';

function Services() {
  return (
    <section id="services" className="bg-white p-8 rounded-lg shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 border-b-2 border-purple-300 pb-2">Our Services</h2>
      <p className="text-gray-700 leading-relaxed mb-4">Sheelaa offers a range of services designed to provide clarity and direction:</p>
      <ul className="list-disc list-inside ml-4 text-gray-700">
        <li className="mb-2"><strong>Numerology Readings:</strong> Deep insights into your life path, personality, and destiny based on numbers.</li>
        <li className="mb-2"><strong>Tarot Card Readings:</strong> Guidance and foresight through intuitive interpretation of tarot cards.</li>
        <li className="mb-2"><strong>Vastu Shastra Consultation:</strong> Harmonizing living and working spaces for positive energy flow.</li>
        <li className="mb-2"><strong>Spiritual Guidance:</strong> Personalized advice and practices for spiritual growth and well-being.</li>
        <li><strong>Astrology Reports:</strong> Understanding planetary influences on your life and future.</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mt-4">Each service is tailored to the individual's needs, ensuring a unique and transformative experience.</p>
    </section>
  );
}

export default Services;

