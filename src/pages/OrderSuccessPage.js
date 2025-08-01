import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Auto redirect to store page after 5 seconds
    const timer = setTimeout(() => {
      navigate('/store');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-lg shadow-xl max-w-lg mx-auto m-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-amber-100 mb-6">
            <i className="fas fa-check text-5xl text-solid-gold"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Merci pour votre commande !
          </h1>
          <p className="text-gray-600 mb-8">
            Votre commande a été passée avec succès. Nous vous enverrons une confirmation par e-mail sous peu.
          </p>
          <div className="space-y-4">
            <Link 
              to="/store" 
              className="w-full bg-gold-gradient text-black font-bold py-3 px-6 rounded-lg shadow-lg inline-block transition-transform transform hover:scale-105"
            >
              Retourner à la boutique
            </Link>
            <p className="text-sm text-gray-500">
              Redirection automatique dans 5 secondes...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccessPage; 