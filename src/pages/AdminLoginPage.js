import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, getCurrentUser } from '../lib/supabase';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          navigate('/admin');
        }
      } catch (error) {
        // User not authenticated, stay on login page
      }
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(formData.email, formData.password);
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="login-card rounded-xl shadow-2xl p-6 sm:p-8">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Link to="/">
              <img 
                src="/meubledor-logo.png" 
                alt="Meubles D'Or Logo" 
                className="h-12 sm:h-16 w-auto" 
              />
            </Link>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            Espace Administration
          </h1>
          <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            Veuillez vous connecter pour continuer.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse e-mail
              </label>
              <div className="mt-1">
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-white admin-form-input p-3 rounded-md border focus:ring-0 text-base"
                  placeholder="admin@lesdunes.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="mt-1">
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password" 
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-white admin-form-input p-3 rounded-md border focus:ring-0 text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="#" className="font-medium text-solid-gold hover:text-amber-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button 
                type="submit"
                disabled={loading}
                className={`w-full bg-gold-gradient text-black font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center transition text-base ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Connexion...
                  </>
                ) : (
                  'Connexion'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 