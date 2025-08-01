import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const bgLayer1Ref = useRef(null);
    const bgLayer2Ref = useRef(null);
    const heroContentRef = useRef(null);
    const whyUsContentRef = useRef(null);
    const artDeVivreImageRef = useRef(null);
    const [usedImages, setUsedImages] = useState([]);
    const [artDeVivreImageIndex, setArtDeVivreImageIndex] = useState(0);

    // Furniture and home decor images
    const furnitureImages = [
        'https://i.ibb.co/6ctYNnRc/469113297-122174855732250548-6525420541625637313-n.jpg',
        'https://i.ibb.co/Cg58nP5/469123823-122174855840250548-2072990956534221544-n.jpg',
        'https://i.ibb.co/QFhFSN1Q/469336618-122174868158250548-5788196013317939872-n.jpg',
        'https://i.ibb.co/qYj1SY7V/469451088-122174868128250548-2321412941780524835-n.jpg',
        'https://i.ibb.co/nNjkqkjP/469513912-122174868062250548-3080077122788198805-n.jpg',
        'https://i.ibb.co/N27bLB5x/468996288-122174857880250548-3886560443513509818-n.jpg',
        'https://i.ibb.co/XZ8yN7qN/469084650-122174857334250548-231732444313980576-n.jpg',
        'https://i.ibb.co/xKdWfG8R/469256026-122174857520250548-1274654823924891549-n.jpg',
        'https://i.ibb.co/0pRnHYYP/469507968-122174857952250548-6952797865101045703-n.jpg',
        'https://i.ibb.co/bMcnj7wP/469058104-122174868068250548-4887715905826584636-n.jpg',
        'https://i.ibb.co/Cp88Rsxh/469084626-122174868134250548-2975654777674222801-n.jpg'
    ];

    // Function to get a random image that hasn't been used in the last 2 images
    const getRandomImage = () => {
        // Get the last used image to avoid showing it again immediately
        const lastUsedImage = usedImages[usedImages.length - 1];
        
        // Filter out the last used image to prevent consecutive repeats
        const availableImages = furnitureImages.filter(img => img !== lastUsedImage);
        
        // If we've used most images, reset the used images array but still avoid the last one
        if (availableImages.length <= 1) {
            setUsedImages([]);
            return furnitureImages[Math.floor(Math.random() * furnitureImages.length)];
        }
        
        const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
        setUsedImages(prev => [...prev, randomImage]); // Add the new image to the used list
        return randomImage;
    };

    useEffect(() => {
        // Preload images
        furnitureImages.forEach(src => { new Image().src = src; });

        let currentImageIndex = 0;
        const initialImage = getRandomImage();
        if (bgLayer1Ref.current) {
            bgLayer1Ref.current.style.backgroundImage = `url(${initialImage})`;
        }

        const slideshowInterval = setInterval(() => {
            const nextImage = getRandomImage();
            const activeLayer = bgLayer1Ref.current?.style.opacity === '0' ? bgLayer1Ref.current : bgLayer2Ref.current;
            const hiddenLayer = bgLayer1Ref.current?.style.opacity === '0' ? bgLayer2Ref.current : bgLayer1Ref.current;

            if (activeLayer && hiddenLayer) {
                activeLayer.style.backgroundImage = `url(${nextImage})`;
                activeLayer.style.opacity = '1';
                hiddenLayer.style.opacity = '0';
            }
        }, 4000); // Increased to 4 seconds for better viewing

        // Art de Vivre image slideshow
        const artDeVivreInterval = setInterval(() => {
            setArtDeVivreImageIndex(prev => (prev + 1) % furnitureImages.length);
        }, 2000); // Change every 2 seconds

        // Sticky scroll animation logic
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const vh = window.innerHeight;
            const isMobile = window.innerWidth < 768; // Disable all animations on mobile

            if (heroContentRef.current) {
                if (isMobile) {
                    // On mobile: keep everything static
                    heroContentRef.current.style.opacity = 1;
                    heroContentRef.current.style.filter = 'blur(0px)';
                    heroContentRef.current.style.transform = 'scale(1)';
                } else {
                    // On desktop: delay the blur effect significantly
                    const heroProgress = Math.min(1, (scrollY - vh * 0.5) / (vh * 0.8));
                    if (heroProgress > 0) {
                        heroContentRef.current.style.opacity = 1 - heroProgress * 0.8;
                        heroContentRef.current.style.filter = `blur(${heroProgress * 8}px)`;
                        heroContentRef.current.style.transform = `scale(${1 - heroProgress * 0.05})`;
                    } else {
                        heroContentRef.current.style.opacity = 1;
                        heroContentRef.current.style.filter = 'blur(0px)';
                        heroContentRef.current.style.transform = 'scale(1)';
                    }
                }
            }

            if (whyUsContentRef.current) {
                if (isMobile) {
                    // On mobile: keep everything static
                    whyUsContentRef.current.style.opacity = 1;
                    whyUsContentRef.current.style.filter = 'blur(0px)';
                    whyUsContentRef.current.style.transform = 'scale(1)';
                } else {
                    // On desktop: delay the blur effect significantly
                    const whyUsScrollStart = vh * 1.5; // Start much later
                    if (scrollY > whyUsScrollStart) {
                        const whyUsProgress = Math.min(1, (scrollY - whyUsScrollStart) / (vh * 0.8));
                        whyUsContentRef.current.style.opacity = 1 - whyUsProgress * 0.8;
                        whyUsContentRef.current.style.filter = `blur(${whyUsProgress * 8}px)`;
                        whyUsContentRef.current.style.transform = `scale(${1 - whyUsProgress * 0.05})`;
                    } else {
                        whyUsContentRef.current.style.opacity = 1;
                        whyUsContentRef.current.style.filter = 'blur(0px)';
                        whyUsContentRef.current.style.transform = 'scale(1)';
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearInterval(slideshowInterval);
            clearInterval(artDeVivreInterval);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="text-gray-800" style={{ fontFamily: 'Lato, sans-serif', backgroundColor: '#FDFBF5' }}>
            {/* Section 1: Hero */}
            <section id="hero-section" className="w-full min-h-screen flex items-center justify-center text-center text-white overflow-hidden">
                {/* Background Image Layers for Slideshow */}
                <div 
                    ref={bgLayer1Ref}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out z-[1]"
                    style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
                ></div>
                <div 
                    ref={bgLayer2Ref}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out z-[1]"
                    style={{ backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0 }}
                ></div>
                
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                
                <div 
                    ref={heroContentRef}
                    className="relative z-20 p-4 sm:p-8 flex flex-col items-center"
                    style={{ 
                        willChange: 'transform, opacity, filter',
                        transition: 'transform 0.1s linear, opacity 0.1s linear, filter 0.1s linear'
                    }}
                >
                    <h1 className="font-playfair text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Meubles D'Or
                    </h1>
                    <p className="mt-2 sm:mt-4 text-base sm:text-xl md:text-2xl font-light tracking-wider max-w-2xl text-white text-center px-4">
                        Élégance Intemporelle pour Votre Intérieur &mdash; Où le Luxe Rencontre le Confort.
                    </p>
                    <button 
                        onClick={() => navigate('/store')}
                        className="mt-6 sm:mt-12 bg-white text-black font-bold text-sm sm:text-lg tracking-widest uppercase px-6 sm:px-12 py-3 sm:py-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-100 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-lg border-2 border-white"
                    >
                        Découvrir Notre Collection
                    </button>
                </div>
            </section>

            {/* Section 2: Why Choose Us - Redesigned */}
            <section id="why-us-section" className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 py-16 sm:py-20 lg:py-24">
                <div 
                    ref={whyUsContentRef}
                    className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
                    style={{ 
                        willChange: 'transform, opacity, filter',
                        transition: 'transform 0.1s linear, opacity 0.1s linear, filter 0.1s linear'
                    }}
                >
                    <div className="text-center mb-16 sm:mb-20 lg:mb-24">
                        <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
                            L'Excellence de Meubles D'Or
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto mb-8"></div>
                        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto px-4 leading-relaxed font-light">
                            Découvrez pourquoi les connaisseurs choisissent Meubles D'Or pour transformer leurs intérieurs
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
                        {/* Feature 1 */}
                        <div className="group relative bg-white rounded-2xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:-translate-y-2 border border-gray-100">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M4 17v4M2 19h4M17 3v4M16 5h4M19 17v4M18 19h4M12 9a3 3 0 100 6 3 3 0 000-6z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-center pt-8">
                                <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Artisanat d'Exception
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Chaque pièce est créée par des artisans passionnés utilisant des techniques traditionnelles et des matériaux nobles sélectionnés avec soin.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="group relative bg-white rounded-2xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:-translate-y-2 border border-gray-100">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-center pt-8">
                                <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Design Intemporel
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Nos créations transcendent les modes éphémères pour vous offrir une élégance qui s'harmonise avec tous les styles et toutes les époques.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="group relative bg-white rounded-2xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:-translate-y-2 border border-gray-100">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zM2 12h2m16 0h2"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-center pt-8">
                                <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Service Sur Mesure
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                    Notre équipe d'experts vous accompagne dans chaque étape, de la conception à l'installation, pour créer l'espace de vos rêves.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Features Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-16 sm:mt-20">
                        <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-8 sm:p-10 border border-amber-100">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <h4 className="font-playfair text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Garantie Qualité
                                </h4>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                Tous nos meubles bénéficient d'une garantie exceptionnelle, témoignant de notre engagement envers la qualité et la durabilité.
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-8 sm:p-10 border border-amber-100">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </div>
                                <h4 className="font-playfair text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Livraison Rapide
                                </h4>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                Service de livraison et d'installation professionnel pour une expérience sans souci, partout au Maroc.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Who We Are */}
            <section id="who-we-are-section" className="w-full min-h-screen flex items-center justify-center bg-white py-16 sm:py-20 lg:py-24 mb-16 sm:mb-20 lg:mb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20" style={{ willChange: 'transform, opacity, filter', transition: 'transform 0.1s linear, opacity 0.1s linear, filter 0.1s linear' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
                        <div className="relative mb-8 sm:mb-0">
                            <img 
                                src={furnitureImages[artDeVivreImageIndex]} 
                                alt="Elegant furniture display" 
                                className="rounded-lg shadow-xl w-full h-[400px] lg:h-[500px] object-cover transition-all duration-1000 ease-in-out" 
                                style={{ 
                                    opacity: 1,
                                    transform: 'scale(1)',
                                    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
                                }}
                            />
                        </div>
                        <div className="max-w-lg space-y-6 sm:space-y-8">
                            <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>L'Art de Vivre</h2>
                            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                Chez Meubles D'Or, nous croyons que votre intérieur est le reflet de votre âme. Notre collection de mobilier et d'accessoires d'intérieur n'est pas simplement un assortiment d'objets, mais une galerie soigneusement organisée d'expériences en attente d'être découvertes. Chaque table, chaque chaise, chaque accessoire est choisi pour sa capacité à inspirer, à réconforter et à devenir une partie intemporelle de votre histoire personnelle. Transformez votre espace en un sanctuaire d'élégance et de confort.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white relative z-10">
                <div className="border-t border-gray-700/50">
                    <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm sm:text-base">&copy; {new Date().getFullYear()} Meubles D'Or. Tous Droits Réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 