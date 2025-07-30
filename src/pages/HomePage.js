import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroCarousel from '../components/HeroCarousel';
import { getProducts, getCategories, subscribeToProducts, subscribeToCategories } from '../lib/supabase';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [currentGridSize, setCurrentGridSize] = useState(1);
  const [priceFilter, setPriceFilter] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortOption, setSortOption] = useState('relevance');
  const [isPriceRangeExpanded, setIsPriceRangeExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

  // Grid size configurations
  const gridClasses = [
    { base: 'grid-cols-1', md: 'md:grid-cols-2', xl: 'xl:grid-cols-2' }, // Largest
    { base: 'grid-cols-2', md: 'md:grid-cols-3', xl: 'xl:grid-cols-3' }, // Default
    { base: 'grid-cols-2', md: 'md:grid-cols-4', xl: 'xl:grid-cols-4' }, // Smaller
    { base: 'grid-cols-3', md: 'md:grid-cols-5', xl: 'xl:grid-cols-5' }  // Smallest
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        console.log('Loaded data:', { 
          products: productsData?.length || 0, 
          categories: categoriesData?.length || 0 
        });
        
        setProducts(productsData || []);
        setAllCategories(categoriesData || []);
        
        // Group categories into main categories with subcategories
        const mainCats = (categoriesData || [])
          .filter(cat => cat.parent_id === null)
          .map(mainCat => ({
            ...mainCat,
            subcategories: (categoriesData || []).filter(cat => cat.parent_id === mainCat.id)
          }));
        
        setMainCategories(mainCats);
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const productSubscription = subscribeToProducts(() => {
      console.log('Products updated - reloading...');
      loadData();
    });

    const categorySubscription = subscribeToCategories(() => {
      console.log('Categories updated - reloading...');
      loadData();
    });

    return () => {
      if (productSubscription) productSubscription.unsubscribe();
      if (categorySubscription) categorySubscription.unsubscribe();
    };
  }, []);

  // Handle clicks outside of filter sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if sidebar is open and we're on mobile
      if (isFilterSidebarOpen && window.innerWidth < 1024) {
        // Check if the click was outside the sidebar
        const sidebar = document.getElementById('filter-sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          setIsFilterSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterSidebarOpen]);

  const changeGridSize = (direction) => {
    if (direction === 'in' && currentGridSize > 0) {
      setCurrentGridSize(currentGridSize - 1);
    } else if (direction === 'out' && currentGridSize < gridClasses.length - 1) {
      setCurrentGridSize(currentGridSize + 1);
    }
  };

  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryFilter = (categoryId) => {
    // If clicking the same category again, just toggle its expanded state but keep it selected
    if (selectedCategory === categoryId) {
      // If it's a main category with subcategories, toggle its expanded state
      const selectedMainCategory = mainCategories.find(cat => cat.id.toString() === categoryId);
      if (selectedMainCategory && selectedMainCategory.subcategories?.length > 0) {
        toggleCategoryExpanded(selectedMainCategory.id);
      }
      return;
    }
    
    setSelectedCategory(categoryId);
    
    // If it's a main category, expand it to show subcategories
    const selectedMainCategory = mainCategories.find(cat => cat.id.toString() === categoryId);
    if (selectedMainCategory && selectedMainCategory.subcategories?.length > 0) {
      setExpandedCategories(prev => ({
        ...prev,
        [selectedMainCategory.id]: true
      }));
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceFilter(1000);
  };

  // Filter products based on selected category and price
  const filteredProducts = products.filter(product => {
    // Category filtering logic
    const categoryMatch = (() => {
      if (!selectedCategory) return true; // Show all if no category selected
      
      // Check if selected category is a main category
      const selectedMainCategory = mainCategories.find(cat => cat.id.toString() === selectedCategory);
      
      if (selectedMainCategory) {
        // If it's a main category, show products from this category and all its subcategories
        const subcategoryIds = selectedMainCategory.subcategories?.map(sub => sub.id.toString()) || [];
        return product.category_id?.toString() === selectedCategory || 
               subcategoryIds.includes(product.category_id?.toString());
      } else {
        // If it's a subcategory, show only products from this subcategory
        return product.category_id?.toString() === selectedCategory;
      }
    })();
    
    const priceMatch = !product.price || product.price <= priceFilter;
    return categoryMatch && priceMatch;
  });

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'relevance':
      default:
        return 0; // Keep original order
    }
  });

  // Get category display name (handles both main and subcategories)
  const getCategoryDisplayName = (categoryId) => {
    const category = allCategories.find(cat => cat.id.toString() === categoryId);
    if (!category) return 'Non catégorisé';
    
    if (category.parent_id) {
      const parentCategory = allCategories.find(cat => cat.id === category.parent_id);
      return parentCategory ? `${parentCategory.name} > ${category.name}` : category.name;
    }
    
    return category.name;
  };

  // Get display name for selected category (including "and subcategories" for main categories)
  const getSelectedCategoryDisplayName = () => {
    if (!selectedCategory) return '';
    
    const selectedMainCategory = mainCategories.find(cat => cat.id.toString() === selectedCategory);
    if (selectedMainCategory && selectedMainCategory.subcategories?.length > 0) {
      return `${selectedMainCategory.name} et sous-catégories`;
    }
    
    return getCategoryDisplayName(selectedCategory);
  };

  const currentGridClasses = gridClasses[currentGridSize];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solid-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Les Dunes d'Or | Collection Exclusive de Produits de Luxe</title>
        <meta name="description" content="Découvrez notre collection exclusive de produits de luxe et design. Livraison dans toute la Tunisie." />
        <meta name="keywords" content="produits de luxe, design tunisie, bijoux tunisie, mobilier haut de gamme, accessoires luxe" />
        <link rel="canonical" href="https://lesdunesdor.shop/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Les Dunes d'Or",
            "url": "https://lesdunesdor.shop/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://lesdunesdor.shop/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        {/* Structured data for product list */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": sortedProducts.slice(0, 10).map((product, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.image_urls?.[0] || "",
                "url": `https://lesdunesdor.shop/product/${product.id}`,
                "offers": {
                  "@type": "Offer",
                  "price": product.price,
                  "priceCurrency": "EUR",
                  "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }
            }))
          })}
        </script>
      </Helmet>
      <Header />

      {/* Hero Section */}
      <HeroCarousel 
        onExploreClick={() => {
          document.getElementById('product-grid-section')?.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }}
      />

      {/* Main Content */}
      <div id="product-grid-section" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          
          {/* Filter Sidebar */}
          <aside 
            className={`fixed top-0 left-0 h-full w-full max-w-xs bg-white p-6 shadow-xl z-40 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:col-span-3 lg:shadow-sm lg:sticky lg:h-[calc(100vh-6rem)] lg:max-h-screen overflow-y-auto ${
                isFilterSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            style={{ top: "6rem" }} // 6rem = 96px, which is the header height (24 units = 96px)
            id="filter-sidebar"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Filtres</h2>
              <button 
                className="lg:hidden text-gray-500 hover:text-gray-800"
                onClick={() => setIsFilterSidebarOpen(false)}
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            {/* Mobile Close Arrow Button - Visible only on mobile */}
            {isFilterSidebarOpen && (
              <div className="lg:hidden fixed top-1/2 right-0 transform -translate-y-1/2 z-50">
                <button
                  className="bg-white shadow-lg rounded-r-lg px-2 py-6 text-gray-600 hover:text-gray-800 border border-gray-200 border-l-0"
                  onClick={() => setIsFilterSidebarOpen(false)}
                >
                  <i className="fas fa-chevron-left text-xl"></i>
                </button>
              </div>
            )}

            {/* Price Range Filter - Moved to top */}
            <div className="mb-6 bg-gray-50 rounded-lg p-3">
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => setIsPriceRangeExpanded(!isPriceRangeExpanded)}
              >
                <h3 className="font-semibold text-gray-700">Gamme de Prix</h3>
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <i className={`fas ${isPriceRangeExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                </button>
              </div>
              
              {isPriceRangeExpanded && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Prix Maximum: {priceFilter} TND</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full slider-gold" 
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 TND</span>
                      <span>500 TND</span>
                      <span>1000 TND</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-500">TND</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="1000" 
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(Math.min(1000, Math.max(0, e.target.value)))}
                        className="w-24 pl-7 py-1 border border-gray-300 rounded-md text-sm" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Categories Filter - Moved below price range */}
            <div className="mb-6 bg-gray-50 rounded-lg p-3">
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              >
                <h3 className="font-semibold text-gray-700">Catégories</h3>
                <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                  <i className={`fas ${isCategoriesExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                </button>
              </div>
              
              {isCategoriesExpanded && (
                <div className="mt-4 space-y-2">
                  {/* All Categories Button */}
                  <button
                    onClick={() => handleCategoryFilter('')}
                    className={`w-full flex items-center text-left font-medium transition-colors p-2 rounded-lg ${
                      selectedCategory === '' 
                        ? 'bg-solid-gold text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-th fa-fw mr-2"></i>
                    <span>Toutes les catégories</span>
                  </button>

                  {/* Main Categories with Subcategories */}
                  {mainCategories.map((mainCategory) => (
                    <div key={mainCategory.id} className="space-y-1">
                      {/* Main Category */}
                      <div className="flex items-center">
                        <button
                          onClick={() => handleCategoryFilter(mainCategory.id.toString())}
                          className={`flex-1 flex items-center text-left font-medium transition-colors p-2 rounded-lg ${
                            selectedCategory === mainCategory.id.toString() 
                              ? 'bg-solid-gold text-white' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <i className="fas fa-folder fa-fw mr-2"></i>
                          <span>{mainCategory.name}</span>
                          {mainCategory.subcategories?.length > 0 && (
                            <span className="ml-1 text-xs opacity-80">
                              ({mainCategory.subcategories.length})
                            </span>
                          )}
                        </button>
                        
                        {/* Expand/Collapse Button */}
                        {mainCategory.subcategories && mainCategory.subcategories.length > 0 && (
                          <button
                            onClick={() => toggleCategoryExpanded(mainCategory.id)}
                            className="ml-1 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <i className={`fas ${expandedCategories[mainCategory.id] ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {(expandedCategories[mainCategory.id] || selectedCategory === mainCategory.id.toString()) && mainCategory.subcategories && (
                        <div className="ml-4 space-y-1">
                          {mainCategory.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              onClick={() => handleCategoryFilter(subcategory.id.toString())}
                              className={`w-full flex items-center text-left text-sm transition-colors p-2 rounded-lg ${
                                selectedCategory === subcategory.id.toString() 
                                  ? 'bg-solid-gold text-white' 
                                  : selectedCategory === mainCategory.id.toString()
                                  ? 'text-gray-700 bg-yellow-50 border border-yellow-100' // Highlight when parent is selected
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <i className="fas fa-tag fa-fw mr-2"></i>
                              <span>{subcategory.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 sticky bottom-0 pt-4 pb-2 bg-white">
              <button
                onClick={clearFilters}
                className="w-full bg-gold-gradient text-black font-medium py-2 px-4 rounded-lg transition opacity-80 hover:opacity-100 shadow-sm flex items-center justify-center"
              >
                <i className="fas fa-times-circle mr-2"></i>
                Effacer les Filtres
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-9">
            {/* Sorting and View Options */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 flex-shrink-0">
                Affichage de <span className="font-bold">{sortedProducts.length}</span> produits
                {selectedCategory && (
                  <span className="ml-2 text-solid-gold">
                    dans "{getSelectedCategoryDisplayName()}"
                  </span>
                )}
              </p>
              <div className="flex items-center flex-wrap justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                <select 
                  className="border border-gray-300 rounded-md text-sm p-2 order-2 sm:order-1 w-full sm:w-auto"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="relevance">Trier par Pertinence</option>
                  <option value="price-asc">Trier par Prix (croissant)</option>
                  <option value="price-desc">Trier par Prix (décroissant)</option>
                  <option value="newest">Trier par Nouveautés</option>
                </select>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  {/* View controls */}
                  <div className="hidden sm:flex items-center gap-1">
                    <button 
                      onClick={() => changeGridSize('in')}
                      disabled={currentGridSize === 0}
                      className="w-9 h-9 border rounded-md text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <button 
                      onClick={() => changeGridSize('out')}
                      disabled={currentGridSize === gridClasses.length - 1}
                      className="w-9 h-9 border rounded-md text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                  </div>
                  <button 
                    className="lg:hidden text-gray-600 p-2 border rounded-md flex items-center"
                    onClick={() => setIsFilterSidebarOpen(true)}
                  >
                    <i className="fas fa-filter mr-1"></i> Filtres
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`grid gap-4 md:gap-6 ${currentGridClasses.base} ${currentGridClasses.md} ${currentGridClasses.xl}`}>
              {sortedProducts.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <i className="fas fa-box-open text-6xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {selectedCategory ? 'Aucun produit dans cette catégorie' : 'Aucun produit disponible'}
                  </h3>
                  <p className="text-gray-500">
                    {selectedCategory 
                      ? 'Essayez de sélectionner une autre catégorie ou effacez les filtres.'
                      : 'Les produits apparaîtront ici une fois ajoutés via le panneau d\'administration.'
                    }
                  </p>
                  {selectedCategory && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 bg-solid-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Voir tous les produits
                    </button>
                  )}
                </div>
              ) : (
                sortedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden product-card">
                    <Link to={`/product/${product.id}`} className="block aspect-square overflow-hidden">
                      <img 
                        src={product.image_urls?.[0] || 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit'} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                    </Link>
                    <div className="p-3 md:p-4">
                      <span className="text-xs text-gray-500">
                        {getCategoryDisplayName(product.category_id?.toString())}
                      </span>
                      <h3 className="text-sm md:text-base font-semibold text-gray-800 mt-1 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-base md:text-lg font-bold text-solid-gold">
                              {product.price?.toFixed(2)} TND
                            </span>
                            {product.old_price && (
                              <span className="text-xs text-gray-400 line-through">
                                {product.old_price.toFixed(2)} TND
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {product.stock}
                          </p>
                        </div>
                        
                        <Link
                          to={`/product/${product.id}`}
                          className="bg-solid-gold text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-600 transition-colors"
                        >
                          Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer />

      {/* Filter Sidebar Overlay */}
      {isFilterSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsFilterSidebarOpen(false)}
        >
          <div className="absolute top-4 right-4">
            <button 
              className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              onClick={() => setIsFilterSidebarOpen(false)}
            >
              <i className="fas fa-times text-gray-600"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage; 