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
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/store" className="flex items-center group">
              <img 
                src="/meubledor-logo-new.png" 
                alt="Meubles D'Or Logo" 
                className="h-14 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
              <span className="ml-1 text-lg font-bold text-gray-800 hidden sm:block" style={{ fontFamily: 'Playfair Display, serif' }}>
                Meubles D'Or
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/store" 
              className={`transition ${
                isActivePage('/store') 
                  ? 'font-semibold text-solid-gold' 
                  : 'text-gray-600 hover:text-gold'
              }`}
            >
              Accueil
            </Link>
            <Link 
              to="/" 
              className={`transition ${
                isActivePage('/') 
                  ? 'font-semibold text-solid-gold' 
                  : 'text-gray-600 hover:text-gold'
              }`}
            >
              Landing Page
            </Link>
          </nav>
          <button 
            className="md:hidden text-gray-600 hover:text-gold transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <Link 
              to="/store" 
              className={`block py-2 px-4 rounded ${
                isActivePage('/store') 
                  ? 'font-semibold text-solid-gold bg-gray-50' 
                  : 'text-gray-600 hover:text-gold hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link 
              to="/" 
              className={`block py-2 px-4 rounded ${
                isActivePage('/') 
                  ? 'font-semibold text-solid-gold bg-gray-50' 
                  : 'text-gray-600 hover:text-gold hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Landing Page
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 