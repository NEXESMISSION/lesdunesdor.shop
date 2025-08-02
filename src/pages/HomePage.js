import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroCarousel from '../components/HeroCarousel';
import { getProducts, getCategories, subscribeToProducts, subscribeToCategories, supabase, unsubscribeAll } from '../lib/supabase';

// Helper component for SVG icons
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [currentGridSize, setCurrentGridSize] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState({ 'Toutes': true });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortOption, setSortOption] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Grid size configurations
  const gridClasses = [
    { base: 'grid-cols-1', md: 'md:grid-cols-2', xl: 'xl:grid-cols-2' }, // Largest
    { base: 'grid-cols-2', md: 'md:grid-cols-3', xl: 'xl:grid-cols-3' }, // Default
    { base: 'grid-cols-2', md: 'md:grid-cols-4', xl: 'xl:grid-cols-4' }, // Smaller
    { base: 'grid-cols-3', md: 'md:grid-cols-5', xl: 'xl:grid-cols-5' }  // Smallest
  ];

  // Memoized loadData function to prevent unnecessary re-renders
  const loadData = useCallback(async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
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
  }, []);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    loadData();

    // Set up real-time subscriptions with debouncing
    let debounceTimer;

    const debouncedReload = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
      loadData();
      }, 1000); // Debounce for 1 second
    };

    // Only set up subscriptions after initial load
    setTimeout(() => {
      subscribeToProducts((payload) => {
        debouncedReload();
      });

      subscribeToCategories((payload) => {
        debouncedReload();
      });
    }, 2000);

    return () => {
      clearTimeout(debounceTimer);
      unsubscribeAll();
    };
  }, [loadData]);

  // Handle category selection
  const handleCategoryChange = (categoryName) => {
    setSelectedCategories(prev => {
      const newSelection = { ...prev };
      const isToutes = categoryName === 'Toutes';
      const isCurrentlySelected = !!newSelection[categoryName];

      if (isToutes) {
        // If "Toutes" is clicked, select/deselect all
        const selectAll = !isCurrentlySelected;
        Object.keys(newSelection).forEach(key => {
          newSelection[key] = selectAll;
        });
        // Also update subcategories based on the new "Toutes" state
        mainCategories.forEach(mainCat => {
          newSelection[mainCat.name] = selectAll;
          mainCat.subcategories?.forEach(sub => {
            newSelection[sub.name] = selectAll;
          });
        });
        newSelection['Toutes'] = selectAll;
      } else {
        // Toggle individual category
        newSelection[categoryName] = !isCurrentlySelected;
        
        // If a specific category is deselected, "Toutes" should also be deselected
        if (!newSelection[categoryName]) {
          newSelection['Toutes'] = false;
        } else {
          // Check if all other categories are selected to update "Toutes"
          const allSelected = mainCategories.every(mainCat => {
            const mainSelected = !!newSelection[mainCat.name];
            const allSubsSelected = mainCat.subcategories?.every(sub => !!newSelection[sub.name]) ?? true;
            return mainSelected && allSubsSelected;
          });
          if (allSelected) {
            newSelection['Toutes'] = true;
          }
        }
      }
      return newSelection;
    });
  };

  const clearCategories = () => {
    const allSelected = {};
    // Select all categories including "Toutes"
    allSelected['Toutes'] = true;
    mainCategories.forEach(mainCat => {
      allSelected[mainCat.name] = true;
      mainCat.subcategories?.forEach(sub => {
        allSelected[sub.name] = true;
      });
    });
    setSelectedCategories(allSelected);
  };

  const resetFilters = () => {
    clearCategories();
  };

  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Memoized filtered and sorted products
  const { filteredProducts, sortedProducts, paginatedProducts, totalPages } = useMemo(() => {
    // Filter products based on selected categories and price
    const filtered = products.filter(product => {
      // Price filtering
      const priceMatch = true; // No price filter
      
      // Category filtering
    const categoryMatch = (() => {
        if (selectedCategories['Toutes']) return true;
        
        const productCategory = allCategories.find(cat => cat.id.toString() === product.category_id?.toString());
        if (!productCategory) return false;
        
        // Check if the product's category or its parent category is selected
        if (productCategory.parent_id) {
          const parentCategory = allCategories.find(cat => cat.id === productCategory.parent_id);
          return selectedCategories[productCategory.name] || selectedCategories[parentCategory?.name];
      } else {
          return selectedCategories[productCategory.name];
      }
    })();
    
    return categoryMatch && priceMatch;
  });

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      case 'newest':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'relevance':
      default:
          return 0;
      }
    });

    // Paginate products
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = sorted.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sorted.length / itemsPerPage);

    return {
      filteredProducts: filtered,
      sortedProducts: sorted,
      paginatedProducts: paginated,
      totalPages
    };
  }, [products, selectedCategories, sortOption, allCategories, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, sortOption]);

  const changeGridSize = (direction) => {
    if (direction === 'in' && currentGridSize > 0) {
      setCurrentGridSize(currentGridSize - 1);
    } else if (direction === 'out' && currentGridSize < gridClasses.length - 1) {
      setCurrentGridSize(currentGridSize + 1);
    }
  };

  // Get category display name (handles both main and subcategories)
  const getCategoryDisplayName = useCallback((categoryId) => {
    const category = allCategories.find(cat => cat.id.toString() === categoryId);
    if (!category) return 'Non catégorisé';
    
    if (category.parent_id) {
      const parentCategory = allCategories.find(cat => cat.id === category.parent_id);
      return parentCategory ? `${parentCategory.name} > ${category.name}` : category.name;
    }
    
    return category.name;
  }, [allCategories]);

  const currentGridClasses = gridClasses[currentGridSize];

  // Pagination controls
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 rounded-md transition-colors duration-200 ${
            currentPage === i
              ? 'bg-gold-custom text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  // Filter Sidebar Content Component
  const SidebarContent = () => (
    <div className="pt-24 p-6 space-y-6 bg-white h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Filtres</h2>
        <button onClick={resetFilters} className="text-sm font-medium text-gold-custom hover-gold transition">
          Réinitialiser
        </button>
      </div>

      {/* Categories Filter */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Catégories</h3>
          <button onClick={clearCategories} className="text-sm font-medium text-gold-custom hover-gold transition">
            Effacer
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="cat-all"
              type="checkbox"
              checked={selectedCategories['Toutes'] || false}
              onChange={() => handleCategoryChange('Toutes')}
              className="w-5 h-5 text-gold-custom bg-gray-100 border-gray-300 rounded focus-ring-gold"
            />
            <label htmlFor="cat-all" className="ml-3 flex justify-between items-center w-full text-sm font-medium text-gray-900">
              Toutes
              <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </label>
          </div>
          
          {mainCategories.map((mainCategory) => {
            const categoryProductCount = products.filter(product => 
              product.category_id?.toString() === mainCategory.id.toString() ||
              mainCategory.subcategories?.some(sub => sub.id.toString() === product.category_id?.toString())
            ).length;
            
            return (
              <div key={mainCategory.id}>
                <div className="flex items-center">
                  {mainCategory.subcategories?.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCategoryExpansion(mainCategory.name);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors mr-2"
                    >
                      <Icon 
                        path={!expandedCategories[mainCategory.name] ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} 
                        className="w-4 h-4 transition-transform duration-200"
                      />
                    </button>
                  )}
                  <input
                    id={`cat-${mainCategory.name}`}
                    type="checkbox"
                    checked={selectedCategories[mainCategory.name] || false}
                    onChange={() => handleCategoryChange(mainCategory.name)}
                    className="w-5 h-5 text-gold-custom bg-gray-100 border-gray-300 rounded focus-ring-gold"
                  />
                  <label htmlFor={`cat-${mainCategory.name}`} className="ml-3 flex justify-between items-center w-full text-sm text-gray-700">
                    {mainCategory.name}
                    <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                      {categoryProductCount}
                    </span>
                  </label>
                </div>
                {mainCategory.subcategories?.length > 0 && (
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    !expandedCategories[mainCategory.name] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-6 space-y-2 mt-2 border-l-2 border-gray-200 pl-4">
                      {mainCategory.subcategories.map((sub) => {
                        const subcategoryProductCount = products.filter(product => 
                          product.category_id?.toString() === sub.id.toString()
                        ).length;
                        
                        return (
                          <div key={sub.id} className="flex items-center py-1">
                            <input
                              id={`cat-${sub.name}`}
                              type="checkbox"
                              checked={selectedCategories[sub.name] || false}
                              onChange={() => handleCategoryChange(sub.name)}
                              className="w-4 h-4 text-gold-custom bg-gray-100 border-gray-300 rounded focus-ring-gold"
                            />
                            <label htmlFor={`cat-${sub.name}`} className="ml-3 flex justify-between items-center w-full text-sm text-gray-600">
                              {sub.name}
                              <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                                {subcategoryProductCount}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroCarousel />
        
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Loading skeleton for sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Loading skeleton for main content */}
            <main className="lg:col-span-9">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Meubles D'Or | Collection Exclusive de Mobilier de Luxe</title>
        <meta name="description" content="Découvrez notre collection exclusive de mobilier et d'accessoires d'intérieur de luxe. Artisanat d'exception et design intemporel." />
        <meta name="keywords" content="meubles de luxe, mobilier haut de gamme, design intérieur tunisie, meubles d'or, décoration luxe, artisanat tunisie" />
        <link rel="canonical" href="https://lesdunesdor.shop/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Meubles D'Or",
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
            className={`fixed top-0 left-0 h-screen w-80 bg-white shadow-xl z-40 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:col-span-3 lg:shadow-sm lg:sticky lg:h-[calc(100vh-6rem)] lg:max-h-screen overflow-y-auto overflow-x-hidden ${
                isFilterSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            style={{ top: "0" }} // Remove the top margin for mobile
            id="filter-sidebar"
          >
            <SidebarContent />
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-9">
            {/* Sorting and View Options */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center flex-wrap justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
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
                </div>
                <div className="flex items-center gap-2 order-2 sm:order-1 w-full sm:w-auto">
                  <select 
                    className="border border-gray-300 rounded-md text-sm p-2 w-full sm:w-auto"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="relevance">Trier par Pertinence</option>
                    <option value="price-asc">Trier par Prix (croissant)</option>
                    <option value="price-desc">Trier par Prix (décroissant)</option>
                    <option value="newest">Trier par Nouveautés</option>
                  </select>
                  <button 
                    className="lg:hidden text-gray-600 p-1.5 rounded-md flex items-center text-sm"
                    onClick={() => setIsFilterSidebarOpen(true)}
                  >
                    <i className="fas fa-filter w-4 h-4 mr-1.5"></i>
                    Filtres
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`grid gap-4 md:gap-6 ${currentGridClasses.base} ${currentGridClasses.md} ${currentGridClasses.xl} transition-all duration-300 ease-in-out`}>
              {paginatedProducts.length === 0 ? (
                <div className="col-span-full text-center py-16 transition-opacity duration-300">
                  <div className="text-gray-400 mb-4">
                    <i className="fas fa-box-open text-6xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {selectedCategories['Toutes'] && selectedCategories['Toutes'] === false ? 'Aucun produit dans cette catégorie' : 'Aucun produit disponible'}
                  </h3>
                  <p className="text-gray-500">
                    {selectedCategories['Toutes'] && selectedCategories['Toutes'] === false 
                      ? 'Essayez de sélectionner une autre catégorie ou effacez les filtres.'
                      : 'Les produits apparaîtront ici une fois ajoutés via le panneau d\'administration.'
                    }
                  </p>
                  {selectedCategories['Toutes'] && selectedCategories['Toutes'] === false && (
                    <button
                      onClick={clearCategories}
                      className="mt-4 bg-gold-custom text-white px-4 py-2 rounded-lg hover-bg-gold transition-colors duration-200"
                    >
                      Voir tous les produits
                    </button>
                  )}
                </div>
              ) : (
                paginatedProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden product-card transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md relative"
                  >
                    <Link to={`/product/${product.id}`} className="block aspect-square overflow-hidden rounded-xl relative">
                      <img 
                        src={product.image_urls?.[0] || 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit'} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produit';
                        }}
                      />
                      {product.old_price && product.old_price > product.price && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                          -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                        </div>
                      )}
                    </Link>
                    <div className="p-3 md:p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 product-name-serif">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex flex-col">
                        <div className="flex flex-col mb-1">
                          {product.old_price && product.old_price > product.price && (
                            <span className="text-sm md:text-base text-red-500 line-through font-medium" style={{ textDecorationColor: 'red' }}>
                              {product.old_price.toFixed(2)} TND
                            </span>
                          )}
                          <span className="text-xl md:text-2xl font-bold text-black">
                            {product.price?.toFixed(2)} TND
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {renderPagination()}
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
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-[9999]" style={{ marginLeft: '160px' }}>
            <button 
              className="bg-red-500 hover:bg-red-600 rounded-l-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors duration-200 border-2 border-white"
              onClick={() => setIsFilterSidebarOpen(false)}
              style={{ marginRight: '-1px' }}
            >
              <Icon path="M15.75 19.5L8.25 12l7.5-7.5" className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
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

                /* Modern Slider Styling */
                input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    cursor: pointer;
                }

                input[type="range"]::-webkit-slider-track {
                    background: #e5e7eb;
                    height: 12px;
                    border-radius: 6px;
                    border: 1px solid #d1d5db;
                }

                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    background: #3b82f6;
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    margin-top: -6px;
                }

                input[type="range"]::-moz-range-track {
                    background: #e5e7eb;
                    height: 12px;
                    border-radius: 6px;
                    border: 1px solid #d1d5db;
                }

                input[type="range"]::-moz-range-thumb {
                    background: #3b82f6;
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                }

                /* Custom Slider Styling */
                .custom-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    outline: none;
                    margin: 0;
                    padding: 0;
                    cursor: grab;
                }

                .custom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 0;
                    height: 0;
                }

                .custom-slider::-moz-range-thumb {
                    width: 0;
                    height: 0;
                    border: none;
                    background: transparent;
                }

                .custom-slider:active {
                    cursor: grabbing;
                }

                /* Hover and Active States for Slider Thumb */
                .custom-slider:hover + div,
                .custom-slider:active + div {
                    transform: translate(-50%, -50%) scale(1.2);
                    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
                }

                .custom-slider:active + div {
                    background-color: #2563eb !important;
                    transform: translate(-50%, -50%) scale(1.3);
                    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0.3);
                }

                /* Smooth Price Slider */
                .price-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 10px;
                    background: linear-gradient(to right, #3b82f6 0%, #3b82f6 50%, #e5e7eb 50%, #e5e7eb 100%);
                    outline: none;
                    border-radius: 15px;
                    transition: none;
                }

                .price-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 25px;
                    height: 25px;
                    background: #3b82f6;
                    cursor: grab;
                    border-radius: 50%;
                    border: 4px solid white;
                    box-shadow: 0 0 6px rgba(0,0,0,0.2);
                    transition: transform 0.1s ease;
                }

                .price-slider::-webkit-slider-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.2);
                    background: #2563eb;
                }

                .price-slider::-moz-range-thumb {
                    width: 25px;
                    height: 25px;
                    background: #3b82f6;
                    cursor: grab;
                    border-radius: 50%;
                    border: 4px solid white;
                    box-shadow: 0 0 6px rgba(0,0,0,0.2);
                    transition: transform 0.1s ease;
                }

                .price-slider::-moz-range-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.2);
                    background: #2563eb;
                }

                /* Custom Gold Color Classes */
                .text-gold-custom {
                    color: #d4af37;
                }
                .bg-gold-custom {
                    background-color: #d4af37;
                }
                .border-gold-custom {
                    border-color: #d4af37;
                }
                .focus-ring-gold:focus {
                    --tw-ring-color: #d4af37;
                }
                .hover-gold:hover {
                    color: #d4af37;
                }
                .hover-bg-gold:hover {
                    background-color: #d4af37;
                }
            `}</style>
    </div>
  );
};

export default HomePage; 