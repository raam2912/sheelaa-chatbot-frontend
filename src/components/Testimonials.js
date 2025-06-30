import React from 'react';

function Testimonials() {
  return (
    <section id="testimonials" className="bg-white p-8 rounded-lg shadow-lg mb-8">
      <h2 className="text-3xl font-bold text-purple-700 mb-4 border-b-2 border-purple-300 pb-2">Testimonials</h2>
      <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="italic text-gray-800 mb-2">"Sheelaa's vastu consultation transformed my home and brought immense positivity. Highly recommend!"</p>
        <p className="text-right font-semibold text-gray-600">- Priya S.</p>
      </div>
      <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="italic text-gray-800 mb-2">"The numerology report was incredibly accurate and helped me make crucial career decisions."</p>
        <p className="text-right font-semibold text-gray-600">- Rahul M.</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="italic text-gray-800 mb-2">"Her astrological insights are profound and her remedies are very effective. She's truly gifted."</p>
        <p className="text-right font-semibold text-gray-600">- Anjali D.</p>
      </div>
    </section>
  );
}

export default Testimonials;

