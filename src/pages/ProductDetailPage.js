import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProduct, createOrder } from '../lib/supabase';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await getProduct(productId);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      }
      setLoading(false);
    };

    loadProduct();
  }, [productId]);

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
    
    // Debounce mechanism - prevent submissions within 2 seconds
    const now = Date.now();
    if (now - lastSubmissionTime < 2000) {
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
      await createOrder(orderData);
      console.log('Order created successfully');
      navigate('/order-success');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solid-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du produit...</p>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{product.name} - Les Dunes d'Or</title>
        <meta name="description" content={product.description?.substring(0, 160) || "Découvrez ce produit exclusif de Les Dunes d'Or"} />
        <meta name="keywords" content={`${product.name}, produits luxe, design tunisie, les dunes d'or`} />
        <link rel="canonical" href={`https://lesdunesdor.shop/product/${product.id}`} />
        <meta property="og:title" content={`${product.name} - Les Dunes d'Or`} />
        <meta property="og:description" content={product.description?.substring(0, 160) || "Découvrez ce produit exclusif de Les Dunes d'Or"} />
        <meta property="og:image" content={hasImages ? productImages[0] : 'https://lesdunesdor.shop/og-image.jpg'} />
        <meta property="og:url" content={`https://lesdunesdor.shop/product/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Les Dunes d'Or" />
        
        {/* Product structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": hasImages ? productImages.map(img => img) : ['https://lesdunesdor.shop/og-image.jpg'],
            "description": product.description,
            "sku": `LD-${product.id}`,
            "mpn": `LD-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": "Les Dunes d'Or"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Product Image Gallery */}
          <div className="order-2 lg:order-1">
            <div className="mb-4">
              <img 
                src={hasImages ? productImages[activeImageIndex] : 'https://placehold.co/600x600/f3f4f6/9ca3af?text=Produit'} 
                alt="Image Principale du Produit" 
                className="w-full h-auto object-cover rounded-lg product-image-shadow"
              />
            </div>
            {hasImages && productImages.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Vignette ${index + 1}`} 
                    className={`w-24 h-24 object-cover rounded-md cursor-pointer border-2 flex-shrink-0 ${
                      activeImageIndex === index ? 'thumbnail-active' : 'border-transparent'
                    }`}
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Order Form */}
          <div className="flex flex-col justify-center order-1 lg:order-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {product.name}
            </h1>
            
            {/* Stars */}
            <div className="flex text-yellow-400 my-2">
              {[...Array(5)].map((_, i) => (
                <i key={i} className="fas fa-star"></i>
              ))}
            </div>

            {/* Prices and Discount */}
            <div className="flex flex-wrap items-baseline mb-4">
              <p className="text-3xl font-bold text-solid-gold">
                {product.price?.toFixed(2)} €
              </p>
              {product.old_price && (
                <p className="text-xl text-gray-500 line-through ml-2">
                  {product.old_price.toFixed(2)} €
                </p>
              )}
              {discount > 0 && (
                <span className="ml-4 bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              Pour commander, veuillez entrer vos informations ci-dessous ou nous appeler au{' '}
              <strong className="text-gray-800">58 415 520</strong>.
            </p>

            {/* Order Form */}
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
                  placeholder="Jean Dupont" 
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
                  placeholder="+33 6 12 34 56 78" 
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
                  placeholder="123 Rue du Faubourg Saint-Honoré, 75008 Paris" 
                  required
                ></textarea>
              </div>

              {/* Total Price Section */}
              <div className="pt-4 border-t mt-6">
                <div className="flex justify-between text-gray-600">
                  <span>Prix unitaire:</span>
                  <span>{product.price?.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total:</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-600 mt-2">
                  <span>Frais de livraison:</span>
                  <span>{(product.delivery_price || 7.00).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold text-xl mt-2">
                  <span>Total:</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={product.stock === 0 || submitting}
                  className={`w-full font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center transition-transform transform ${
                    product.stock === 0 || submitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gold-gradient text-black hover:scale-105'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Commande en cours...
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
        
        {/* Description Section */}
        {product.description && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
            <div className="space-y-6 text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage; 