import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Auto redirect to store page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/store');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
          <p className="text-gray-600 mb-8 text-sm md:text-base">
            Votre commande a été passée avec succès. Nous vous contacterons bientôt pour confirmer les détails de livraison.
          </p>
          <div className="space-y-4">
            <Link 
              to="/store" 
              className="w-full bg-gold-gradient text-black font-bold py-3 px-6 rounded-lg shadow-lg inline-block transition-transform transform hover:scale-105"
            >
              Retourner à la boutique
            </Link>
            <p className="text-sm text-gray-500">
              Redirection automatique dans 3 secondes...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSuccessPage; 