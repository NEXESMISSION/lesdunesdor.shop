import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActivePage = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src="/dunes.png" alt="Meubles D'Or Logo" className="h-16 w-auto" />
              <span className="ml-3 text-xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Meubles D'Or
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition ${
                isActivePage('/') 
                  ? 'font-semibold text-solid-gold' 
                  : 'text-gray-600 hover-text-gold'
              }`}
            >
              Accueil
            </Link>
          </nav>
          <button 
            className="md:hidden text-gray-600 hover-text-gold transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <Link 
              to="/" 
              className={`block py-2 px-4 rounded ${
                isActivePage('/') 
                  ? 'font-semibold text-solid-gold bg-gray-50' 
                  : 'text-gray-600 hover-text-gold hover-bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Accueil
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 