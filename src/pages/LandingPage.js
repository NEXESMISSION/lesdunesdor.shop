import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const bgLayer1Ref = useRef(null);
    const bgLayer2Ref = useRef(null);
    const heroContentRef = useRef(null);
    const [usedImages, setUsedImages] = useState([]);
    const [artDeVivreImageIndex, setArtDeVivreImageIndex] = useState(0);

    // Furniture and home decor images (updated with new URLs)
    const furnitureImages = [
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469084626_122174868134250548_2975654777674222801_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469084650_122174857334250548_231732444313980576_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469113297_122174855732250548_6525420541625637313_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469123823_122174855840250548_2072990956534221544_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469256026_122174857520250548_1274654823924891549_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469451088_122174868128250548_2321412941780524835_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469507968_122174857952250548_6952797865101045703_n.jpg',
        'https://persistent-harlequin-ujxpexfwbp.edgeone.app/469513912_122174868062250548_3080077122788198805_n.jpg'
    ];

    // Function to get a random image that hasn't been used in the last 2 images
    const getRandomImage = () => {
        const lastUsedImage = usedImages[usedImages.length - 1];
        const secondLastUsedImage = usedImages[usedImages.length - 2];
        
        // Filter out the last 2 used images to avoid repetition
        const availableImages = furnitureImages.filter(img => 
            img !== lastUsedImage && img !== secondLastUsedImage
        );
        
        // If we don't have enough images to avoid repetition, reset the tracking
        if (availableImages.length <= 1) {
            setUsedImages([]);
            return furnitureImages[Math.floor(Math.random() * furnitureImages.length)];
        }
        
        const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
        setUsedImages(prev => [...prev, randomImage]);
        return randomImage;
    };

    useEffect(() => {
        // Preload images
        furnitureImages.forEach(src => { new Image().src = src; });

        // Set initial hero background image
        const initialImage = getRandomImage();
        if (bgLayer1Ref.current) {
            bgLayer1Ref.current.style.backgroundImage = `url(${initialImage})`;
        }

        // Hero slideshow
        const slideshowInterval = setInterval(() => {
            const nextImage = getRandomImage();
            const activeLayer = bgLayer1Ref.current?.style.opacity === '0' ? bgLayer1Ref.current : bgLayer2Ref.current;
            const hiddenLayer = bgLayer1Ref.current?.style.opacity === '0' ? bgLayer2Ref.current : bgLayer1Ref.current;

            if (activeLayer && hiddenLayer) {
                activeLayer.style.backgroundImage = `url(${nextImage})`;
                activeLayer.style.opacity = '1';
                hiddenLayer.style.opacity = '0';
            }
        }, 4000);

        // Art de Vivre image slideshow
        const artDeVivreInterval = setInterval(() => {
            setArtDeVivreImageIndex(prev => (prev + 1) % furnitureImages.length);
        }, 3000);

        // Scroll animations using Intersection Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, observerOptions);

        // Observe all scroll-animate elements
        const animatedElements = document.querySelectorAll('.scroll-animate');
        animatedElements.forEach(el => observer.observe(el));

        return () => {
            clearInterval(slideshowInterval);
            clearInterval(artDeVivreInterval);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="antialiased" style={{ 
            fontFamily: 'Inter, sans-serif', 
            backgroundColor: '#121212',
            color: '#E5E5E5'
        }}>
            {/* Custom Styles */}
            <style>{`
                .font-playfair {
                    font-family: 'Playfair Display', serif;
                }
                
                .text-gold {
                    color: #D4AF37;
                }
                .bg-gold {
                    background-color: #D4AF37;
                }
                .border-gold {
                    border-color: #D4AF37;
                }

                .text-shadow-custom {
                    text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
                }
                
                .scroll-animate {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
                    will-change: opacity, transform;
                }
                .scroll-animate.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .bg-layer {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    transition: opacity 1.5s ease-in-out;
                    z-index: 1;
                }
            `}</style>

            {/* HERO SECTION */}
            <header className="relative min-h-screen w-full flex items-center justify-center text-center text-white overflow-hidden">
                {/* Background Image Layers for Slideshow */}
                <div 
                    ref={bgLayer1Ref}
                    className="bg-layer"
                    style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
                ></div>
                <div 
                    ref={bgLayer2Ref}
                    className="bg-layer"
                    style={{ backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0 }}
                ></div>
                
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                
                {/* Hero Content */}
                <div ref={heroContentRef} className="relative z-20 p-4 sm:p-6 max-w-4xl mx-auto scroll-animate is-visible">
                    <h1 className="font-playfair font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight">
                        Meubles D'Or
                    </h1>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-wider text-white/90 max-w-2xl mx-auto text-shadow-custom px-4">
                        Élégance Intemporelle pour Votre Intérieur — Où le Luxe Rencontre le Confort.
                    </p>
                    <button 
                        onClick={() => navigate('/store')}
                        className="mt-6 sm:mt-8 md:mt-12 inline-block bg-white text-black font-bold tracking-widest uppercase px-5 py-2.5 sm:px-6 sm:py-3 md:px-10 md:py-4 rounded-md transition-all duration-300 ease-in-out hover:bg-gray-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 shadow-lg text-xs sm:text-sm md:text-base"
                    >
                        Découvrir Notre Collection
                    </button>
                </div>
            </header>

            <main>
                {/* WHO WE ARE SECTION */}
                <section id="who-we-are-section" className="py-12 sm:py-16 md:py-24 lg:py-32" style={{ backgroundColor: '#121212' }}>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-center">
                            {/* Image */}
                            <div className="scroll-animate">
                                <img 
                                    src={furnitureImages[artDeVivreImageIndex]} 
                                    alt="Elegant furniture display in a showroom" 
                                    className="rounded-lg w-full h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-cover transition-all duration-300 ease-in-out"
                                    style={{ 
                                        opacity: 1,
                                        transform: 'scale(1)',
                                        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
                                    }}
                                />
                            </div>
                            {/* Text Content */}
                            <div className="scroll-animate" style={{ transitionDelay: '150ms' }}>
                                <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                                    L'Art de Vivre
                                </h2>
                                <div className="w-16 sm:w-20 md:w-24 h-1 bg-gold mt-3 sm:mt-4 md:mt-6 mb-4 sm:mb-6 md:mb-8"></div>
                                <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                                    Chez Meubles D'Or, votre intérieur est le reflet de votre âme. Notre collection est une galerie d'expériences en attente d'être découvertes.
                                </p>
                                <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm md:text-base text-gray-400 leading-relaxed">
                                    Chaque pièce est choisie pour inspirer, réconforter et devenir une partie intemporelle de votre histoire. Transformez votre espace en un sanctuaire d'élégance et de confort.
                                </p>
                                <button 
                                    onClick={() => navigate('/store')}
                                    className="mt-6 sm:mt-8 md:mt-10 inline-block bg-transparent border border-white text-white font-bold tracking-widest uppercase px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-md transition-all duration-300 ease-in-out hover:bg-white hover:text-black focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg text-xs sm:text-sm md:text-base"
                                >
                                    Découvrir Notre Collection
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage; 