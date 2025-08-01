import React, { useState, useEffect } from 'react';

const HeroCarousel = ({ onExploreClick }) => {
  // Import hero images for mobile and desktop
  const heroImagePairs = [
    { mobile: '/hero imges/1.png', desktop: '/hero imges/1desktop.png' },
    { mobile: '/hero imges/2.png', desktop: '/hero imges/2desktop.png' },
    { mobile: '/hero imges/3.png', desktop: '/hero imges/3desktop.png' }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to determine if we're on mobile or desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === heroImagePairs.length - 1 ? 0 : prevIndex + 1
        );
        setIsTransitioning(false);
      }, 250); // Half of transition time for smooth effect
      
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [heroImagePairs.length]);

  return (
    <section className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
      {/* Background Images with Smooth Transition */}
      <div className="absolute inset-0">
        {heroImagePairs.map((pair, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out transform ${
              index === currentImageIndex 
                ? `opacity-100 scale-100 ${isTransitioning ? 'opacity-75' : ''}` 
                : 'opacity-0 scale-105'
            }`}
            style={{
              backgroundImage: `url('${isMobile ? pair.mobile : pair.desktop}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Content */}
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start text-white z-10">
        <div className={`transform transition-all duration-700 ease-out ${
          isTransitioning ? 'translate-y-2 opacity-80' : 'translate-y-0 opacity-100'
        }`}>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-4 leading-tight">
            Notre Collection Exclusive
          </h1>
          <p className="mt-2 md:mt-4 text-xs md:text-sm lg:text-base max-w-xs md:max-w-xl mb-4 md:mb-8 leading-relaxed">
            Découvrez des produits d'exception, où le luxe rencontre le design.
          </p>
          <button 
            onClick={onExploreClick}
            className="bg-gold-gradient text-black font-medium text-xs md:text-sm lg:text-base py-2 px-4 md:py-3 md:px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <i className="fas fa-gem mr-1 md:mr-2"></i>
            Explorer la Collection
          </button>
        </div>
      </div>

      {/* Subtle Animation Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-5 transform transition-transform duration-1000 ${
        isTransitioning ? 'translate-x-full' : '-translate-x-full'
      }`} style={{ width: '200%' }} />
    </section>
  );
};

export default HeroCarousel; 