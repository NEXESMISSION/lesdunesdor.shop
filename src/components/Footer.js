import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="text-white" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/meubledor-logo-new.png" 
                alt="Meubles D'Or Logo" 
                className="h-14 w-auto mr-3" 
              />
              <h3 className="text-lg font-semibold text-white">Meubles D'Or</h3>
            </div>
            <p className="mb-4 text-sm text-white">
              Découvrez notre collection exclusive de mobilier et d'accessoires d'intérieur de luxe. 
              Artisanat d'exception et design intemporel.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61579136484387" className="text-white hover:text-gray-300 transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-white hover:text-gray-300 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white hover:text-gray-300 transition-colors">
                  À Propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white hover:text-gray-300 transition-colors">
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
                <span className="text-white">+216 58 678 330</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 pt-8 text-sm text-center">
          <p className="text-white">© {currentYear} Meubles D'Or. Tous Droits Réservés.</p>
        </div>
        
        {/* Admin button - discreet circle in the bottom left */}
        <Link to="/admin" className="absolute bottom-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-20 hover:opacity-70 transition-opacity duration-300" aria-label="Admin Access">
        </Link>
      </div>
    </footer>
  );
};

export default Footer; 