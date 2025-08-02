import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderSuccessPage = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 md:p-12 rounded-lg shadow-xl max-w-lg mx-auto">
          <div className="mx-auto flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-full bg-green-100 mb-6">
            <i className="fas fa-check text-4xl md:text-5xl text-green-600"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Merci pour votre commande !
          </h1>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            Votre commande a été passée avec succès. Nous avons reçu votre commande et nous vous contacterons bientôt pour confirmer les détails de livraison.
          </p>
          <p className="text-gray-600 mb-2 text-sm md:text-base">
            Pour toute question, n'hésitez pas à nous contacter :
          </p>
          <p className="text-gray-800 mb-4 font-semibold">
            <a href="tel:+21658678330" className="hover:underline">+216 58 678 330</a>
          </p>
          <p className="text-gray-600 mb-2 text-sm md:text-base">
            Suivez-nous sur les réseaux sociaux :
          </p>
          <p className="text-gray-800 mb-8">
            <a href="https://www.facebook.com/profile.php?id=61579136484387" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
              <i className="fab fa-facebook mr-1"></i> Facebook
            </a>
          </p>
          <div className="space-y-4">
            <Link 
              to="/store" 
              className="w-full bg-gold-gradient text-black font-bold py-3 px-6 rounded-lg shadow-lg inline-block transition-transform transform hover:scale-105"
            >
              Retourner à la boutique
            </Link>
            <p className="text-sm text-gray-500">
              Cliquez sur le bouton ci-dessus pour retourner à la boutique
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccessPage; 