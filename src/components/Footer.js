import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Les Dunes d'Or</h3>
            <p className="mb-4 text-sm">
              Découvrez notre collection exclusive de produits de luxe et design. 
              Livraison dans toute la Tunisie.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-gray-400 hover:text-white transition-colors">
                  Administration
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-2 text-solid-gold"></i>
                <span>123 Rue de Tunis, Tunis 1000, Tunisie</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone-alt mt-1 mr-2 text-solid-gold"></i>
                <span>+216 58 415 520</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-envelope mt-1 mr-2 text-solid-gold"></i>
                <span>contact@lesdunesdor.shop</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© {currentYear} Les Dunes d'Or. Tous Droits Réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 