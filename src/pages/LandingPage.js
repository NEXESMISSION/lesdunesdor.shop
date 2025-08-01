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
        'https://passing-orange-smgxjce9p7.edgeone.app/469256026_122174857520250548_1274654823924891549_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469113297_122174855732250548_6525420541625637313_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469123823_122174855840250548_2072990956534221544_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469451088_122174868128250548_2321412941780524835_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469513912_122174868062250548_3080077122788198805_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469084626_122174868134250548_2975654777674222801_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469084650_122174857334250548_231732444313980576_n.jpg',
        'https://passing-orange-smgxjce9p7.edgeone.app/469507968_122174857952250548_6952797865101045703_n.jpg'
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
                    <h1 className="font-playfair font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight text-shadow-custom">
                        Meubles D'Or
                    </h1>
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl font-light tracking-wider text-white/90 max-w-2xl mx-auto text-shadow-custom px-4">
                        Élégance Intemporelle pour Votre Intérieur — Où le Luxe Rencontre le Confort.
                    </p>
                    <button 
                        onClick={() => navigate('/store')}
                        className="mt-8 sm:mt-12 inline-block bg-white text-black font-bold tracking-widest uppercase px-6 sm:px-10 py-3 sm:py-4 rounded-md transition-all duration-300 ease-in-out hover:bg-gray-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 shadow-lg text-sm sm:text-base"
                    >
                        Découvrir Notre Collection
                    </button>
                </div>
            </header>

            <main>
                {/* WHY US SECTION */}
                <section id="why-us-section" className="py-16 sm:py-24 md:py-32" style={{ backgroundColor: '#1a1a1a' }}>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-16 items-center">
                            {/* Section Title */}
                            <div className="lg:col-span-1 scroll-animate">
                                <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                                    L'Excellence de Meubles D'Or
                                </h2>
                                <div className="w-20 sm:w-24 h-1 bg-gold mt-4 sm:mt-6 mb-6 sm:mb-8"></div>
                                <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
                                    Découvrez pourquoi les connaisseurs nous choisissent pour transformer leurs intérieurs.
                                </p>
                            </div>

                            {/* Feature Cards */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                {/* Feature Card 1 */}
                                <div className="border border-gray-700/50 p-6 sm:p-8 rounded-lg scroll-animate" style={{ transitionDelay: '150ms' }}>
                                    <svg className="w-8 sm:w-10 h-8 sm:h-10 text-gold mb-4 sm:mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M4 17v4M2 19h4M17 3v4M16 5h4M19 17v4M18 19h4M12 9a3 3 0 100 6 3 3 0 000-6z"></path>
                                    </svg>
                                    <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Artisanat d'Exception</h3>
                                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                        Chaque pièce est créée par des artisans passionnés avec des matériaux nobles.
                                    </p>
                                </div>

                                {/* Feature Card 2 */}
                                <div className="border border-gray-700/50 p-6 sm:p-8 rounded-lg scroll-animate" style={{ transitionDelay: '250ms' }}>
                                    <svg className="w-8 sm:w-10 h-8 sm:h-10 text-gold mb-4 sm:mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                    <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Design Intemporel</h3>
                                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                        Nos créations transcendent les modes pour une élégance durable.
                                    </p>
                                </div>

                                {/* Feature Card 3 */}
                                <div className="border border-gray-700/50 p-6 sm:p-8 rounded-lg scroll-animate" style={{ transitionDelay: '350ms' }}>
                                    <svg className="w-8 sm:w-10 h-8 sm:h-10 text-gold mb-4 sm:mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zM2 12h2m16 0h2"></path>
                                    </svg>
                                    <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Service Sur Mesure</h3>
                                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                        Notre équipe d'experts vous accompagne dans chaque étape.
                                    </p>
                                </div>

                                {/* Feature Card 4 */}
                                <div className="border border-gray-700/50 p-6 sm:p-8 rounded-lg scroll-animate" style={{ transitionDelay: '450ms' }}>
                                    <svg className="w-8 sm:w-10 h-8 sm:h-10 text-gold mb-4 sm:mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Garantie Qualité</h3>
                                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                                        Engagement envers la qualité et la durabilité exceptionnelle.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHO WE ARE SECTION */}
                <section id="who-we-are-section" className="py-16 sm:py-24 md:py-32" style={{ backgroundColor: '#121212' }}>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
                            {/* Image */}
                            <div className="scroll-animate">
                                <img 
                                    src={furnitureImages[artDeVivreImageIndex]} 
                                    alt="Elegant furniture display in a showroom" 
                                    className="rounded-lg w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover transition-all duration-1000 ease-in-out"
                                    style={{ 
                                        opacity: 1,
                                        transform: 'scale(1)',
                                        transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
                                    }}
                                />
                            </div>
                            {/* Text Content */}
                            <div className="scroll-animate" style={{ transitionDelay: '150ms' }}>
                                <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                                    L'Art de Vivre
                                </h2>
                                <div className="w-20 sm:w-24 h-1 bg-gold mt-4 sm:mt-6 mb-6 sm:mb-8"></div>
                                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                                    Chez Meubles D'Or, votre intérieur est le reflet de votre âme. Notre collection est une galerie d'expériences en attente d'être découvertes.
                                </p>
                                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
                                    Chaque pièce est choisie pour inspirer, réconforter et devenir une partie intemporelle de votre histoire. Transformez votre espace en un sanctuaire d'élégance et de confort.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="bg-black text-white">
                <div className="container mx-auto py-12 px-6 lg:px-8 text-center border-t border-gray-800">
                    <p className="text-gray-500">&copy; {new Date().getFullYear()} Meubles D'Or. Tous Droits Réservés.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 