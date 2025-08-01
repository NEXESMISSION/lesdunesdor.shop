import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signOut, getCurrentUser, getProducts, getOrders, getMainCategories,
  deleteProduct, deleteOrder, deleteCategory, createCategory, updateCategory,
  getDashboardStats, subscribeToProducts, subscribeToOrders, subscribeToCategories
} from '../lib/supabase';
import ProductModal from '../components/ProductModal';
import OrderModal from '../components/OrderModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter and pagination states
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    stock: 'all'
  });
  const [orderFilters, setOrderFilters] = useState({
    search: '',
    status: '',
    dateFilter: 'all' // all, today, week, month
  });
  const [productPagination, setProductPagination] = useState({
    currentPage: 1,
    itemsPerPage: 30
  });
  const [orderPagination, setOrderPagination] = useState({
    currentPage: 1,
    itemsPerPage: 30
  });

  // Dashboard stats (calculated from real data)
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0, totalOrders: 0, newCustomers: 0, totalProducts: 0
  });

  // Modal states
  const [productModal, setProductModal] = useState({ isOpen: false, product: null });
  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null });
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, category: null, parentCategory: null });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({ name: '', parent_id: null });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/admin/login');
        return;
      }
      setUser(currentUser);
      console.log('Admin user authenticated:', currentUser.email);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Erreur d\'authentification');
      navigate('/admin/login');
    }
    setLoading(false);
  };

  const loadDashboardData = async () => {
    setDataLoading(true);
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      const [productsData, ordersData, categoriesData, statsData] = await Promise.all([
        getProducts(),
        getOrders(),
        getMainCategories(),
        getDashboardStats()
      ]);

      console.log('Dashboard data loaded:', {
        products: productsData?.length || 0,
        orders: ordersData?.length || 0,
        categories: categoriesData?.length || 0,
        stats: statsData
      });

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setMainCategories(categoriesData || []);
      setDashboardStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Erreur lors du chargement des données');
    }
    
    setDataLoading(false);
  };

  const setupRealtimeSubscriptions = () => {
    try {
      console.log('Setting up realtime subscriptions...');
      
      const productSub = subscribeToProducts((payload) => {
        console.log('Product realtime update:', payload);
        loadDashboardData();
      });
      
      const orderSub = subscribeToOrders((payload) => {
        console.log('Order realtime update:', payload);
        loadDashboardData();
      });
      
      const categorySub = subscribeToCategories((payload) => {
        console.log('Category realtime update:', payload);
        loadDashboardData();
      });

      return () => {
        productSub.unsubscribe();
        orderSub.unsubscribe();
        categorySub.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        setDataLoading(true);
        await deleteProduct(productId);
        await loadDashboardData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression du produit: ' + error.message);
      } finally {
        setDataLoading(false);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        setDataLoading(true);
        await deleteOrder(orderId);
        await loadDashboardData();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Erreur lors de la suppression de la commande: ' + error.message);
      } finally {
        setDataLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      try {
        setDataLoading(true);
        await deleteCategory(categoryId);
        await loadDashboardData();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Erreur lors de la suppression de la catégorie: ' + error.message);
      } finally {
        setDataLoading(false);
      }
    }
  };

  const openCategoryModal = (category = null, parentCategory = null) => {
    setCategoryModal({ isOpen: true, category, parentCategory });
    if (category) {
      setCategoryForm({ 
        name: category.name, 
        parent_id: category.parent_id 
      });
    } else {
      setCategoryForm({ 
        name: '', 
        parent_id: parentCategory ? parentCategory.id : null 
      });
    }
  };

  const closeCategoryModal = () => {
    setCategoryModal({ isOpen: false, category: null, parentCategory: null });
    setCategoryForm({ name: '', parent_id: null });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    
    try {
      setDataLoading(true);
      
      if (categoryModal.category) {
        // Update existing category
        await updateCategory(categoryModal.category.id, categoryForm);
      } else {
        // Create new category
        await createCategory(categoryForm);
      }
      
      await loadDashboardData();
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erreur lors de la sauvegarde de la catégorie: ' + error.message);
    } finally {
      setDataLoading(false);
    }
  };

  const getProductsCount = (categoryId) => {
    return products.filter(product => product.category_id === categoryId).length;
  };

  // Get category name from category ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Non catégorisé';
    
    // Search in all categories (main categories and subcategories)
    const allCategories = mainCategories.flatMap(cat => [cat, ...(cat.subcategories || [])]);
    const category = allCategories.find(cat => cat.id === categoryId);
    
    if (!category) return 'Non catégorisé';
    
    // If it's a subcategory, show "Parent > Child" format
    if (category.parent_id) {
      const parentCategory = allCategories.find(cat => cat.id === category.parent_id);
      return parentCategory ? `${parentCategory.name} > ${category.name}` : category.name;
    }
    
    return category.name;
  };

  // Filter and pagination functions
  const getFilteredProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = !productFilters.search || 
        product.name.toLowerCase().includes(productFilters.search.toLowerCase()) ||
        product.description?.toLowerCase().includes(productFilters.search.toLowerCase());
      
      const matchesCategory = !productFilters.category || 
        product.category_id?.toString() === productFilters.category;
      
      const matchesStock = productFilters.stock === 'all' || 
        (productFilters.stock === 'inStock' && product.stock > 0) ||
        (productFilters.stock === 'outOfStock' && product.stock === 0) ||
        (productFilters.stock === 'lowStock' && product.stock > 0 && product.stock <= 10);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
    
    return filtered;
  };

  const getFilteredOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = !orderFilters.search || 
        order.customer_details?.fullName?.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
        order.customer_details?.phoneNumber?.includes(orderFilters.search) ||
        order.id.toString().includes(orderFilters.search);
      
      const matchesStatus = !orderFilters.status || order.status === orderFilters.status;
      
      const matchesDate = (() => {
        if (orderFilters.dateFilter === 'all') return true;
        
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (orderFilters.dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    // Group by date for better organization
    const groupedByDate = filtered.reduce((groups, order) => {
      const date = new Date(order.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
      return groups;
    }, {});
    
    return { filtered, groupedByDate };
  };

  const getPaginatedItems = (items, pagination) => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solid-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Loading Overlay */}
      {dataLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-solid-gold"></div>
            <span className="text-gray-700">Chargement...</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-solid-gold">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        
        <nav className="mt-8 flex-1">
          <div className="px-4 space-y-2">
            <button
              onClick={() => {
                setActiveSection('dashboard');
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'dashboard' 
                  ? 'bg-solid-gold text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-chart-bar w-5 text-center mr-3"></i>
              <span className="flex-1">Tableau de Bord</span>
            </button>
            
            <button
              onClick={() => {
                setActiveSection('products');
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'products' 
                  ? 'bg-solid-gold text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-box w-5 text-center mr-3"></i>
              <span className="flex-1">Produits</span>
              <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                {products.length}
              </span>
            </button>
            
            <button
              onClick={() => {
                setActiveSection('orders');
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'orders' 
                  ? 'bg-solid-gold text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-shopping-cart w-5 text-center mr-3"></i>
              <span className="flex-1">Commandes</span>
              <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                {orders.length}
              </span>
            </button>
            
            <button
              onClick={() => {
                setActiveSection('categories');
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === 'categories' 
                  ? 'bg-solid-gold text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-tags w-5 text-center mr-3"></i>
              <span className="flex-1">Catégories</span>
              <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                {mainCategories.length}
              </span>
            </button>
          </div>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-500 mb-2 px-4 break-all">
            Connecté: {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <i className="fas fa-sign-out-alt w-5 text-center mr-3"></i>
            <span className="flex-1">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-gray-500 hover:text-gray-600 p-2"
                >
                  <i className="fas fa-bars text-xl"></i>
                </button>
                <h2 className="text-lg font-semibold text-gray-800 lg:hidden">
                  {activeSection === 'dashboard' && 'Tableau de Bord'}
                  {activeSection === 'products' && 'Produits'}
                  {activeSection === 'orders' && 'Commandes'}
                  {activeSection === 'categories' && 'Catégories'}
                </h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 hidden sm:block">Bienvenue, {user?.email}</span>
                <button
                  onClick={loadDashboardData}
                  className="text-gray-600 hover:text-gray-800 p-2"
                  title="Actualiser les données"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tableau de Bord</h2>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <i className="fas fa-euro-sign text-green-600 text-lg sm:text-xl"></i>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Ventes Totales</h3>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800">{dashboardStats.totalSales.toFixed(2)} TND</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <i className="fas fa-shopping-cart text-blue-600 text-lg sm:text-xl"></i>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Commandes</h3>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800">{dashboardStats.totalOrders}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <i className="fas fa-users text-yellow-600 text-lg sm:text-xl"></i>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Commandes Récentes</h3>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800">{dashboardStats.newCustomers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <i className="fas fa-box text-purple-600 text-lg sm:text-xl"></i>
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Produits</h3>
                      <p className="text-lg sm:text-2xl font-bold text-gray-800">{dashboardStats.totalProducts}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 sm:p-6 border-b">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">Commandes Récentes</h3>
                </div>
                <div className="p-4 sm:p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-shopping-cart text-4xl mb-4"></i>
                      <p>Aucune commande pour le moment</p>
                      <p className="text-sm">Les commandes des clients apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b last:border-b-0 space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {order.customer_details?.fullName || 'Client Anonyme'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex flex-col sm:items-end space-y-1">
                            <p className="font-bold text-gray-800">{order.total_amount?.toFixed(2)} TND</p>
                            <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                              order.status === 'Nouvelle' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'En traitement' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'Expédiée' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <details className="bg-white rounded-lg shadow-sm border p-4">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Informations de Debug
                </summary>
                <div className="mt-4 text-sm space-y-2">
                  <p><strong>Produits chargés:</strong> {products.length}</p>
                  <p><strong>Commandes chargées:</strong> {orders.length}</p>
                  <p><strong>Catégories chargées:</strong> {mainCategories.length}</p>
                  <p><strong>Utilisateur:</strong> {user?.email}</p>
                  <p><strong>Dernière mise à jour:</strong> {new Date().toLocaleString('fr-FR')}</p>
                </div>
              </details>
            </div>
          )}

          {activeSection === 'products' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestion des Produits</h2>
                <button
                  onClick={() => setProductModal({ isOpen: true, product: null })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto flex items-center justify-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Ajouter un Produit
                </button>
              </div>

              {/* Product Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Filtres</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                    <input
                      type="text"
                      placeholder="Nom ou description..."
                      value={productFilters.search}
                      onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select
                      value={productFilters.category}
                      onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="">Toutes les catégories</option>
                      {mainCategories.map((mainCategory) => (
                        <optgroup key={mainCategory.id} label={mainCategory.name}>
                          <option value={mainCategory.id}>{mainCategory.name} (Principal)</option>
                          {mainCategory.subcategories?.map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              → {subcategory.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  {/* Stock Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <select
                      value={productFilters.stock}
                      onChange={(e) => setProductFilters({ ...productFilters, stock: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    >
                      <option value="all">Tous les stocks</option>
                      <option value="inStock">En stock</option>
                      <option value="lowStock">Stock faible (≤10)</option>
                      <option value="outOfStock">Rupture de stock</option>
                    </select>
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setProductFilters({ search: '', category: '', stock: 'all' });
                      setProductPagination({ ...productPagination, currentPage: 1 });
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Effacer les filtres
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {(() => {
                  const filteredProducts = getFilteredProducts();
                  const paginatedProducts = getPaginatedItems(filteredProducts, productPagination);
                  const totalPages = getTotalPages(filteredProducts.length, productPagination.itemsPerPage);
                  
                  if (products.length === 0) {
                    return (
                      <div className="text-center py-16 px-4">
                        <div className="text-gray-400 mb-4">
                          <i className="fas fa-box-open text-6xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit</h3>
                        <p className="text-gray-500 mb-4">
                          Commencez par ajouter votre premier produit
                        </p>
                        <button
                          onClick={() => setProductModal({ isOpen: true, product: null })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                        >
                          Ajouter un Produit
                        </button>
                      </div>
                    );
                  }
                  
                  if (filteredProducts.length === 0) {
                    return (
                      <div className="text-center py-16 px-4">
                        <div className="text-gray-400 mb-4">
                          <i className="fas fa-search text-6xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
                        <p className="text-gray-500 mb-4">
                          Essayez de modifier vos filtres de recherche
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Products Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produit
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Catégorie
                              </th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Prix
                              </th>
                              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProducts.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                  Aucun produit trouvé
                                </td>
                              </tr>
                            ) : (
                              paginatedProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                  <td className="px-3 sm:px-4 py-4">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-12 w-12 sm:h-10 sm:w-10">
                                        <img 
                                          className="h-12 w-12 sm:h-10 sm:w-10 rounded-md object-cover" 
                                          src={product.image_urls?.[0] || 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Produit'} 
                                          alt={product.name} 
                                        />
                                      </div>
                                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                                        <div className="md:hidden text-xs text-gray-500 mt-1 space-y-1">
                                          <div>Cat: {getCategoryName(product.category_id)}</div>
                                          <div className="flex items-center space-x-2">
                                            <span>Stock:</span>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                              product.stock > 10 
                                                ? 'bg-green-100 text-green-800' 
                                                : product.stock > 0 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {product.stock}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {getCategoryName(product.category_id)}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{product.price?.toFixed(2)} TND</div>
                                    {product.old_price && (
                                      <div className="text-xs text-gray-500 line-through">{product.old_price?.toFixed(2)} TND</div>
                                    )}
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      product.stock > 10 
                                        ? 'bg-green-100 text-green-800' 
                                        : product.stock > 0 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {product.stock}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        onClick={() => setProductModal({ isOpen: true, product })}
                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                                        title="Modifier"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                                        title="Supprimer"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <p className="text-sm text-gray-600 text-center sm:text-left">
                              Page {productPagination.currentPage} sur {totalPages}
                            </p>
                            <div className="flex justify-center sm:justify-end space-x-2">
                              <button
                                onClick={() => setProductPagination({ 
                                  ...productPagination, 
                                  currentPage: Math.max(1, productPagination.currentPage - 1) 
                                })}
                                disabled={productPagination.currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <i className="fas fa-chevron-left"></i> Précédent
                              </button>
                              <button
                                onClick={() => setProductPagination({ 
                                  ...productPagination, 
                                  currentPage: Math.min(totalPages, productPagination.currentPage + 1) 
                                })}
                                disabled={productPagination.currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Suivant <i className="fas fa-chevron-right"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {activeSection === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestion des Commandes</h2>

              {/* Order Filters */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Filtres</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                    <input
                      type="text"
                      placeholder="Nom client, téléphone, #commande..."
                      value={orderFilters.search}
                      onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={orderFilters.status}
                      onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="Nouvelle">Nouvelle</option>
                      <option value="En traitement">En traitement</option>
                      <option value="Expédiée">Expédiée</option>
                      <option value="Livrée">Livrée</option>
                      <option value="Annulée">Annulée</option>
                    </select>
                  </div>
                  
                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                    <select
                      value={orderFilters.dateFilter}
                      onChange={(e) => setOrderFilters({ ...orderFilters, dateFilter: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Toutes les dates</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                    </select>
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setOrderFilters({ search: '', status: '', dateFilter: 'all' });
                      setOrderPagination({ ...orderPagination, currentPage: 1 });
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Effacer les filtres
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {(() => {
                  const { filtered: filteredOrders, groupedByDate } = getFilteredOrders();
                  const paginatedOrders = getPaginatedItems(filteredOrders, orderPagination);
                  const totalPages = getTotalPages(filteredOrders.length, orderPagination.itemsPerPage);
                  
                  if (orders.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                          <i className="fas fa-shopping-cart text-6xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune commande</h3>
                        <p className="text-gray-500">
                          Les commandes des clients apparaîtront ici
                        </p>
                      </div>
                    );
                  }
                  
                  if (filteredOrders.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                          <i className="fas fa-search text-6xl"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune commande trouvée</h3>
                        <p className="text-gray-500 mb-4">
                          Essayez de modifier vos filtres de recherche
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Orders Table */}
                      <div className="overflow-x-auto">
                        <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
                          <p className="text-sm text-gray-600">
                            Affichage de {paginatedOrders.length} sur {filteredOrders.length} commandes
                          </p>
                        </div>
                        
                        {/* Group orders by date for better organization */}
                        {Object.entries(groupedByDate).map(([date, dayOrders]) => {
                          const dateOrders = dayOrders.filter(order => 
                            paginatedOrders.some(pOrder => pOrder.id === order.id)
                          );
                          
                          if (dateOrders.length === 0) return null;
                          
                          return (
                            <div key={date}>
                              {/* Date Header */}
                              <div className="bg-gray-100 px-4 sm:px-6 py-3 border-b">
                                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                                  {new Date(date).toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                  <span className="ml-2 text-sm text-gray-600">
                                    ({dateOrders.length} commande{dateOrders.length > 1 ? 's' : ''})
                                  </span>
                                </h4>
                              </div>
                              
                              {/* Orders for this date */}
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Commande
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Client
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Montant
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Statut
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {dateOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                                          <div className="text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {order.customer_details?.fullName || 'Client Anonyme'}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {order.customer_details?.phoneNumber}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {order.total_amount?.toFixed(2)} TND
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          order.status === 'Nouvelle' ? 'bg-blue-100 text-blue-800' :
                                          order.status === 'En traitement' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'Expédiée' ? 'bg-green-100 text-green-800' :
                                          order.status === 'Livrée' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
                                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                          onClick={() => setOrderModal({ isOpen: true, order })}
                                          className="text-blue-600 hover:text-blue-900 p-1"
                                          title="Voir détails"
                                        >
                                          <i className="fas fa-eye"></i>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteOrder(order.id)}
                                          className="text-red-600 hover:text-red-900 p-1"
                                          title="Supprimer"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <p className="text-sm text-gray-600 text-center sm:text-left">
                              Page {orderPagination.currentPage} sur {totalPages}
                            </p>
                            <div className="flex justify-center sm:justify-end space-x-2">
                              <button
                                onClick={() => setOrderPagination({ 
                                  ...orderPagination, 
                                  currentPage: Math.max(1, orderPagination.currentPage - 1) 
                                })}
                                disabled={orderPagination.currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <i className="fas fa-chevron-left"></i> Précédent
                              </button>
                              <button
                                onClick={() => setOrderPagination({ 
                                  ...orderPagination, 
                                  currentPage: Math.min(totalPages, orderPagination.currentPage + 1) 
                                })}
                                disabled={orderPagination.currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Suivant <i className="fas fa-chevron-right"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {activeSection === 'categories' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestion des Catégories</h2>
                <button
                  onClick={() => openCategoryModal()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Ajouter une Catégorie Principale
                </button>
              </div>

              {mainCategories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                      <i className="fas fa-tags text-6xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune catégorie</h3>
                    <p className="text-gray-500 mb-4">
                      Créez votre première catégorie pour organiser vos produits
                    </p>
                    <button
                      onClick={() => openCategoryModal()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Ajouter une Catégorie
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {mainCategories.map((mainCategory) => (
                    <div key={mainCategory.id} className="bg-white rounded-lg shadow-sm border">
                      {/* Main Category Header */}
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-folder text-blue-600 text-xl"></i>
                            <div>
                              <h3 className="font-semibold text-gray-800">{mainCategory.name}</h3>
                              <p className="text-sm text-gray-500">
                                {getProductsCount(mainCategory.id)} produits • {mainCategory.subcategories?.length || 0} sous-catégories
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openCategoryModal(null, mainCategory)}
                              className="text-green-600 hover:text-green-900 text-sm p-2"
                              title="Ajouter une sous-catégorie"
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                            <button
                              onClick={() => openCategoryModal(mainCategory)}
                              className="text-blue-600 hover:text-blue-900 p-2"
                              title="Modifier"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(mainCategory.id, mainCategory.name)}
                              className="text-red-600 hover:text-red-900 p-2"
                              title="Supprimer"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {mainCategory.subcategories && mainCategory.subcategories.length > 0 && (
                        <div className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {mainCategory.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <i className="fas fa-tag text-gray-500 flex-shrink-0"></i>
                                  <span className="text-sm font-medium text-gray-700 truncate">{subcategory.name}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    ({getProductsCount(subcategory.id)})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <button
                                    onClick={() => openCategoryModal(subcategory)}
                                    className="text-blue-600 hover:text-blue-900 text-sm p-1"
                                    title="Modifier"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(subcategory.id, subcategory.name)}
                                    className="text-red-600 hover:text-red-900 text-sm p-1"
                                    title="Supprimer"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null })}
        product={productModal.product}
        onSuccess={loadDashboardData}
      />

      <OrderModal
        isOpen={orderModal.isOpen}
        onClose={() => setOrderModal({ isOpen: false, order: null })}
        order={orderModal.order}
        onSuccess={loadDashboardData}
      />

      {/* Category Modal */}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {categoryModal.category 
                    ? 'Modifier la Catégorie' 
                    : categoryModal.parentCategory 
                    ? `Ajouter une Sous-catégorie à "${categoryModal.parentCategory.name}"`
                    : 'Ajouter une Catégorie Principale'
                  }
                </h3>
                <button
                  onClick={closeCategoryModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={dataLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {dataLoading ? 'Sauvegarde...' : (categoryModal.category ? 'Modifier' : 'Ajouter')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminDashboard; 