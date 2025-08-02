import React from 'react';
import Footer from '../components/Footer';

const ContactPage = () => {
  const handleCallUs = () => {
    window.location.href = 'tel:+21658678330';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Contact</h1>
            <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Contactez-nous
            </h2>
            <p className="text-gray-600 mb-8">
              Nous sommes là pour vous aider. Appelez-nous maintenant pour toute question ou assistance.
            </p>
            <button
              onClick={handleCallUs}
              className="w-full bg-solid-gold text-white font-bold py-4 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-300 text-lg"
            >
              📞 Appelez-nous maintenant
            </button>
            <p className="text-sm text-gray-500 mt-4">
              +216 58 678 330
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactPage; 