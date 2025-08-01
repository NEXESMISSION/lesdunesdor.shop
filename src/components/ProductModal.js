import React, { useState, useEffect } from 'react';
import { getMainCategories, createProduct, updateProduct } from '../lib/supabase';

const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    old_price: '',
    stock: '',
    category_id: '',
    delivery_price: '7.00',
    image_urls: []
  });
  const [imageUrls, setImageUrls] = useState('');
  const [imageList, setImageList] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageValidation, setImageValidation] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (product) {
        // Edit mode
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price?.toString() || '',
          old_price: product.old_price?.toString() || '',
          stock: product.stock?.toString() || '',
          category_id: product.category_id?.toString() || '',
          delivery_price: product.delivery_price?.toString() || '7.00',
          image_urls: product.image_urls || []
        });
        setImageUrls((product.image_urls || []).join('\n'));
        setImageList(product.image_urls || []);
      } else {
        // Add mode
        resetForm();
      }
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Loading categories for product modal...');
      const data = await getMainCategories();
      console.log('Categories loaded:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      old_price: '',
      stock: '',
      category_id: '',
      delivery_price: '7.00',
      image_urls: []
    });
    setImageUrls('');
    setImageList([]);
    setNewImageUrl('');
    setImageValidation({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUrlsChange = (e) => {
    setImageUrls(e.target.value);
  };

  // Validate image URL
  const validateImageUrl = (url) => {
    return new Promise((resolve) => {
      if (!url || !url.trim()) {
        resolve({ isValid: false, error: 'URL vide' });
        return;
      }

      const img = new Image();
      img.onload = () => resolve({ isValid: true, error: null });
      img.onerror = () => resolve({ isValid: false, error: 'Image non accessible' });
      img.src = url.trim();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        resolve({ isValid: false, error: 'Timeout - URL trop lente' });
      }, 10000);
    });
  };

  // Add new image URL to the list
  const addImageUrl = async () => {
    if (!newImageUrl.trim()) return;

    const url = newImageUrl.trim();
    if (imageList.includes(url)) {
      alert('Cette image est déjà ajoutée');
      return;
    }

    // Show loading state
    setImageValidation(prev => ({ ...prev, [url]: { isLoading: true } }));

    const validation = await validateImageUrl(url);
    setImageValidation(prev => ({ ...prev, [url]: validation }));

    if (validation.isValid) {
      setImageList(prev => [...prev, url]);
      setNewImageUrl('');
    }
  };

  // Remove image from list
  const removeImage = (indexToRemove) => {
    setImageList(prev => prev.filter((_, index) => index !== indexToRemove));
    // Also remove from validation
    const removedUrl = imageList[indexToRemove];
    setImageValidation(prev => {
      const newValidation = { ...prev };
      delete newValidation[removedUrl];
      return newValidation;
    });
  };

  // Move image up in the list
  const moveImageUp = (index) => {
    if (index === 0) return;
    setImageList(prev => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList;
    });
  };

  // Move image down in the list
  const moveImageDown = (index) => {
    if (index === imageList.length - 1) return;
    setImageList(prev => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList;
    });
  };

  // Bulk add images from textarea
  const addBulkImages = async () => {
    const urls = imageUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => !imageList.includes(url));

    if (urls.length === 0) return;

    // Validate all URLs
    for (const url of urls) {
      setImageValidation(prev => ({ ...prev, [url]: { isLoading: true } }));
      const validation = await validateImageUrl(url);
      setImageValidation(prev => ({ ...prev, [url]: validation }));
      
      if (validation.isValid) {
        setImageList(prev => [...prev, url]);
      }
    }
    
    setImageUrls('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        delivery_price: parseFloat(formData.delivery_price) || 7.00,
        image_urls: imageList
      };

      if (product) {
        // Edit existing product
        await updateProduct(product.id, productData);
      } else {
        // Create new product
        await createProduct(productData);
      }

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {product ? 'Modifier le Produit' : 'Ajouter un Produit'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Produit *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Tapis Kairouan, Babouche artisanale, Fouta Sousse..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                {categoriesLoading ? (
                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                    Chargement des catégories...
                  </div>
                ) : (
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(mainCategory => (
                      <optgroup key={mainCategory.id} label={mainCategory.name}>
                        {/* Main category option */}
                        <option value={mainCategory.id}>
                          {mainCategory.name} (Catégorie principale)
                        </option>
                        {/* Subcategory options */}
                        {mainCategory.subcategories?.map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            → {subcategory.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Aucune catégorie trouvée. Veuillez créer des catégories d'abord.
                  </p>
                )}
                {!categoriesLoading && categories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Choisissez une sous-catégorie de préférence pour plus de précision
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description détaillée du produit..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (TND) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="25.500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ancien Prix (TND)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="35.000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="delivery_price" className="block text-sm font-medium text-gray-700 mb-1">
                Prix de Livraison (TND)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="delivery_price"
                name="delivery_price"
                value={formData.delivery_price || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="7.000"
              />
              <p className="text-sm text-gray-500 mt-1">Laissez vide pour utiliser le prix par défaut (7.00)</p>
            </div>

            {/* Enhanced Image Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Gestion des Images</h3>
              
              {/* Add Single Image */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
                >
                  <i className="fas fa-plus mr-1"></i>
                  Ajouter
                </button>
              </div>

              {/* Bulk Add Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ajouter Plusieurs Images (une URL par ligne)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    value={imageUrls}
                    onChange={handleImageUrlsChange}
                    rows="3"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://exemple.com/image1.jpg\nhttps://exemple.com/image2.jpg"
                  />
                  <button
                    type="button"
                    onClick={addBulkImages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto self-start"
                  >
                    <i className="fas fa-upload mr-1"></i>
                    Ajouter Tout
                  </button>
                </div>
              </div>

              {/* Image List with Previews */}
              {imageList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Images du Produit ({imageList.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {imageList.map((url, index) => {
                      const validation = imageValidation[url];
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          {/* Image Preview */}
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            {validation?.isLoading ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : validation?.isValid ? (
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-red-500">
                                <i className="fas fa-exclamation-triangle"></i>
                              </div>
                            )}
                          </div>

                          {/* URL and Status */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate" title={url}>
                              {url}
                            </p>
                            {validation?.error && (
                              <p className="text-xs text-red-500">{validation.error}</p>
                            )}
                            {validation?.isValid && (
                              <p className="text-xs text-green-500">
                                <i className="fas fa-check mr-1"></i>
                                Image valide
                              </p>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Monter"
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === imageList.length - 1}
                              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Descendre"
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-2 text-red-500 hover:text-red-700"
                              title="Supprimer"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Sauvegarde...
                  </>
                ) : (
                  product ? 'Modifier' : 'Ajouter'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal; 