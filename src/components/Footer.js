import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="text-gray-400" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/meubledor-logo.png" 
                alt="Meubles D'Or Logo" 
                className="h-10 w-auto mr-3" 
              />
              <h3 className="text-lg font-semibold text-white">Meubles D'Or</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Découvrez notre collection exclusive de mobilier et d'accessoires d'intérieur de luxe. 
              Artisanat d'exception et design intemporel.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="text-gray-500 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" className="text-gray-500 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
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
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <i className="fas fa-phone-alt mt-1 mr-2 text-gold"></i>
                <span className="text-gray-400">+216 58 415 520</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p className="text-gray-500">© {currentYear} Meubles D'Or. Tous Droits Réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 