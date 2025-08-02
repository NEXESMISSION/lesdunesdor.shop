import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProduct, createOrder, getProducts } from '../lib/supabase';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: ''
  });
  const [showSoldOutPopup, setShowSoldOutPopup] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        // Reset all state when loading new product
        setLoading(true);
        setProduct(null);
        setRelatedProducts([]);
        setActiveImageIndex(0);
        setQuantity(1);
        setFormData({
          fullName: '',
          phoneNumber: '',
          address: ''
        });
        setIsImageModalOpen(false);
        setModalImageIndex(0);
        
        const productData = await getProduct(productId);
        setProduct(productData);
        
        // Fetch related products from the same category
        if (productData?.category_id) {
          const allProducts = await getProducts();
          const related = allProducts
            .filter(p => 
              p.id !== productData.id && 
              p.category_id === productData.category_id
            )
            .slice(0, 4); // Limit to 4 related products
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      }
      setLoading(false);
    };

    loadProduct();
    
    // Scroll to top when product changes
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageModalOpen, modalImageIndex]);

  // Show sold out popup when product has 0 stock
  useEffect(() => {
    if (product && product.stock === 0) {
      setShowSoldOutPopup(true);
    }
  }, [product]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuantityChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue > 0) {
      setQuantity(newValue);
    } else {
      setQuantity(1);
    }
  };

  const openImageModal = (index) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const nextImage = () => {
    if (hasImages) {
      setModalImageIndex((modalImageIndex + 1) % productImages.length);
    }
  };

  const previousImage = () => {
    if (hasImages) {
      setModalImageIndex(modalImageIndex === 0 ? productImages.length - 1 : modalImageIndex - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (!isImageModalOpen) return;
    
    switch (e.key) {
      case 'Escape':
        closeImageModal();
        break;
      case 'ArrowRight':
        nextImage();
        break;
      case 'ArrowLeft':
        previousImage();
        break;
      default:
        break;
    }
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && productImages.length > 1) {
      nextImage();
    }
    if (isRightSwipe && productImages.length > 1) {
      previousImage();
    }
  };

  const calculateTotal = () => {
    if (!product) return { subtotal: 0, total: 0 };
    const subtotal = product.price * quantity;
    const total = subtotal + (product.delivery_price || 7.00);
    return { subtotal, total };
  };

  const calculateDiscount = () => {
    if (!product || !product.old_price) return 0;
    return Math.round(((product.old_price - product.price) / product.old_price) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (submitting) return;
    
    // Reduced debounce mechanism - prevent submissions within 1 second
    const now = Date.now();
    if (now - lastSubmissionTime < 1000) {
      alert('Veuillez patienter avant de soumettre une nouvelle commande.');
      return;
    }
    
    if (!formData.fullName || !formData.phoneNumber || !formData.address) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    setSubmitting(true);
    setLastSubmissionTime(now);

    const { subtotal, total } = calculateTotal();

    const orderData = {
      customer_details: formData,
      total_amount: total,
      status: 'Nouvelle',
      form_data: {
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit_price: product.price,
        subtotal: subtotal,
        delivery_price: product.delivery_price || 7.00
      }
    };

    try {
      console.log('Creating order:', orderData);
      const result = await createOrder(orderData);
      console.log('Order created successfully:', result);
      
      // Send email notification through our backend API and handle redirect
      try {
        console.log('Sending email notification to backend...');
        // Use environment variable for API URL in production
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const emailResponse = await axios.post(`${API_URL}/send-order`, {
          name: formData.fullName,
          email: formData.email || 'non-fourni@example.com',
          orderDetails: `
            <h3>Détails du Produit:</h3>
            <p>Produit: ${product.name}</p>
            <p>Quantité: ${quantity}</p>
            <p>Prix unitaire: ${product.price} TND</p>
            <p>Sous-total: ${subtotal} TND</p>
            <p>Frais de livraison: ${product.delivery_price || 7.00} TND</p>
            <p>Total: ${total} TND</p>
            
            <h3>Détails du Client:</h3>
            <p>Nom: ${formData.fullName}</p>
            <p>Téléphone: ${formData.phoneNumber}</p>
            <p>Adresse: ${formData.address}</p>
          `
        });
        console.log('Email notification response:', emailResponse.data);
        // Redirect to the order success page without showing an alert
        navigate('/order-success');
      } catch (emailError) {
        // Log detailed error information
        console.error('Error sending email notification:', emailError.response?.data || emailError.message);
        // Redirect to success page even if email fails - the order was still created
        navigate('/order-success');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-solid-gold mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Chargement du produit...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produit non trouvé</h1>
          <p className="text-gray-600 mb-6">Ce produit n'existe pas ou a été supprimé.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-gold-gradient text-black font-bold py-2 px-4 rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, total } = calculateTotal();
  const discount = calculateDiscount();
  const productImages = product.image_urls || [];
  const hasImages = productImages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50" key={productId}>
      <style>{`
        .text-gold-custom {
          color: #d4af37;
        }
        .hover\\:text-gold-600:hover {
          color: #b8941f;
        }
      `}</style>
      <Helmet>
        <title>{product.name} - Meubles D'Or</title>
        <meta name="description" content={product.description?.substring(0, 160) || "Découvrez ce produit exclusif de Meubles D'Or"} />
        <meta name="keywords" content={`${product.name}, produits luxe, design tunisie, meubles d'or`} />
        <link rel="canonical" href={`https://lesdunesdor.shop/product/${product.id}`} />
        <meta property="og:title" content={`${product.name} - Meubles D'Or`} />
        <meta property="og:description" content={product.description?.substring(0, 160) || "Découvrez ce produit exclusif de Meubles D'Or"} />
        <meta property="og:image" content={hasImages ? productImages[0] : 'https://lesdunesdor.shop/og-image.jpg'} />
        <meta property="og:url" content={`https://lesdunesdor.shop/product/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Meubles D'Or" />
        
        {/* Product structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": hasImages ? productImages.map(img => img) : ['https://lesdunesdor.shop/og-image.jpg'],
            "description": product.description,
            "sku": `MD-${product.id}`,
            "mpn": `MD-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": "Meubles D'Or"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://lesdunesdor.shop/product/${product.id}`,
              "priceCurrency": "EUR",
              "price": product.price,
              "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })}
        </script>
      </Helmet>
      <Header />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        
        {/* Product Details & Order Form - New Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Image Gallery */}
          <div>
            {hasImages && (
              <div className="flex gap-4">
                {/* Thumbnails on the left side */}
                <div className="hidden md:flex flex-col gap-2 w-20 overflow-y-auto max-h-96">
                  {productImages.map((image, index) => (
                    <div 
                      key={index}
                      className="relative flex-shrink-0"
                    >
                      <img 
                        src={image} 
                        alt={`Vignette ${index + 1}`} 
                        className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all duration-300 ease-in-out ${
                          activeImageIndex === index 
                            ? 'border-amber-500 shadow-lg scale-105' 
                            : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                        }`}
                        onClick={() => setActiveImageIndex(index)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Non+Disponible';
                        }}
                        loading="lazy"
                      />
                      {activeImageIndex === index && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Main Image */}
                <div className="flex-1 relative">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src={hasImages ? productImages[activeImageIndex] : 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Produit'} 
                      alt="Image Principale du Produit" 
                      className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer"
                      onClick={() => openImageModal(activeImageIndex)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Image+Non+Disponible';
                      }}
                      loading="eager"
                    />
                    
                    {/* Discount badge on top corner */}
                    {discount > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-lg shadow-lg">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  
                  {/* Image counter */}
                  {hasImages && productImages.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {activeImageIndex + 1} / {productImages.length}
                    </div>
                  )}
                  
                  {/* Navigation arrows for images */}
                  {hasImages && productImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(activeImageIndex === 0 ? productImages.length - 1 : activeImageIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all duration-200"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(activeImageIndex === productImages.length - 1 ? 0 : activeImageIndex + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all duration-200"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Mobile thumbnails - horizontal scroll */}
            {hasImages && (
              <div className="md:hidden flex space-x-4 overflow-x-auto pb-4 mt-4 scroll-smooth">
                {productImages.map((image, index) => (
                  <div 
                    key={index}
                    className="relative flex-shrink-0"
                  >
                    <img 
                      src={image} 
                      alt={`Vignette ${index + 1}`} 
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition-all duration-300 ease-in-out ${
                        activeImageIndex === index 
                          ? 'border-amber-500 shadow-lg scale-105' 
                          : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Non+Disponible';
                      }}
                      loading="lazy"
                    />
                    {activeImageIndex === index && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Product info that appears under the image on the left column */}
            <div className="mt-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 product-name-serif">
                {product.name}
              </h1>
              
              {/* Stars */}
              <div className="flex text-yellow-400 my-2">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>

              {/* Prices and Discount */}
              <div className="flex flex-col items-start mb-4">
                {product.old_price && (
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xl text-red-500 line-through" style={{ textDecorationColor: 'red' }}>
                      {product.old_price.toFixed(2)} TND
                    </p>
                    {discount > 0 && (
                      <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                )}
                <p className="text-3xl font-bold text-black">
                  {product.price?.toFixed(2)} TND
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Form */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <p className="text-gray-600 leading-relaxed mb-4 md:mb-6">
                Pour commander, veuillez entrer vos informations ci-dessous ou nous appeler au{' '}
                <strong className="text-gray-800">58 678 330</strong>.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nom Complet
                </label>
                <input 
                  type="text" 
                  name="fullName" 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm form-input" 
                  placeholder="Ahmed Ben Salem, Fatma Mansouri..." 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Numéro de Téléphone
                </label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  id="phoneNumber" 
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm form-input" 
                  placeholder="+216 58 678 330" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantité
                </label>
                <div className="flex items-center mt-1">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300 focus:outline-none"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input 
                    type="number" 
                    name="quantity" 
                    id="quantity" 
                    min="1" 
                    max={product.stock || 999}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-16 text-center px-3 py-2 bg-white border-y border-gray-300 focus:outline-none focus:ring-1 focus:ring-solid-gold" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                    className="px-3 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300 focus:outline-none"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                {product.stock && product.stock < 10 && (
                  <p className="text-sm text-orange-600 mt-1">
                    Plus que {product.stock} en stock !
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Adresse de Livraison
                </label>
                <textarea 
                  name="address" 
                  id="address" 
                  rows="3" 
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm form-input" 
                  placeholder="123 Avenue Habib Bourguiba, Tunis 1000, Tunisie" 
                  required
                ></textarea>
              </div>

              {/* Total Price Section */}
              <div className="pt-4 border-t mt-6">
                <div className="flex justify-between text-gray-600">
                  <span>Prix unitaire:</span>
                  <span>{product.price?.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total:</span>
                  <span>{subtotal.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-gray-600 mt-2">
                  <span>Frais de livraison:</span>
                  <span>{(product.delivery_price || 7.00).toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold text-xl mt-2">
                  <span>Total:</span>
                  <span>{total.toFixed(2)} TND</span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={product.stock === 0 || submitting}
                  className={`w-full font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 ${
                    product.stock === 0 || submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gold-gradient text-black hover:scale-105 hover:shadow-xl'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-3"></div>
                      Traitement en cours...
                    </>
                  ) : product.stock === 0 ? (
                    'Rupture de stock'
                  ) : (
                    'Passer la Commande'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div> {/* End of grid layout div */}
        
        {/* Description Section */}
        {product.description && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
            <div className="space-y-6 text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>
        )}
        
        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Produits similaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(relatedProduct => (
                <div 
                  key={relatedProduct.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden product-card transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md relative"
                >
                  <Link to={`/product/${relatedProduct.id}`} className="block aspect-square overflow-hidden rounded-xl relative">
                    <img 
                      src={relatedProduct.image_urls?.[0] || 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit'} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit';
                      }}
                    />
                    {relatedProduct.old_price && relatedProduct.old_price > relatedProduct.price && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                        -{Math.round(((relatedProduct.old_price - relatedProduct.price) / relatedProduct.old_price) * 100)}%
                      </div>
                    )}
                  </Link>
                  <div className="p-3 md:p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 product-name-serif">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    
                    <div className="flex flex-col">
                      <div className="flex flex-col mb-1">
                        {relatedProduct.old_price && relatedProduct.old_price > relatedProduct.price && (
                          <span className="text-sm md:text-base text-red-500 line-through font-medium" style={{ textDecorationColor: 'red' }}>
                            {relatedProduct.old_price.toFixed(2)} TND
                          </span>
                        )}
                        <span className="text-xl md:text-2xl font-bold text-black">
                          {relatedProduct.price?.toFixed(2)} TND
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock: {relatedProduct.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {isImageModalOpen && hasImages && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center"
               onTouchStart={onTouchStart}
               onTouchMove={onTouchMove}
               onTouchEnd={onTouchEnd}
          >
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Previous Arrow */}
            {productImages.length > 1 && (
              <button
                onClick={previousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
            )}

            {/* Next Arrow */}
            {productImages.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={productImages[modalImageIndex]}
              alt={`Image ${modalImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Image+Non+Disponible';
              }}
            />

            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium">
                {modalImageIndex + 1} / {productImages.length}
              </div>
            )}

            {/* Thumbnails at bottom */}
            {productImages.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setModalImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      modalImageIndex === index 
                        ? 'border-white' 
                        : 'border-transparent hover:border-white hover:border-opacity-50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sold Out Popup */}
      {showSoldOutPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Produit Épuisé
              </h3>
              <p className="text-gray-600 mb-6">
                Ce produit est actuellement en rupture de stock. Veuillez patienter ou nous contacter pour plus d'informations.
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Appelez-nous :</strong>
                  </p>
                  <a 
                    href="tel:+21658415520" 
                    className="text-lg font-bold text-black hover:text-gray-700 transition-colors"
                  >
                    +216 58 415 520
                  </a>
                </div>
                <button 
                  onClick={() => setShowSoldOutPopup(false)}
                  className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetailPage;