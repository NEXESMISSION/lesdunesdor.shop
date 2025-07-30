import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct, getCategories } from '../lib/supabase';

const ProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
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
      } else {
        // Add mode
        resetForm();
      }
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process image URLs
      const imageUrlArray = imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        delivery_price: parseFloat(formData.delivery_price) || 7.00,
        image_urls: imageUrlArray
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

  // Group categories by main category
  const groupedCategories = categories.reduce((groups, category) => {
    if (category.parent_id === null) {
      // Main category
      if (!groups[category.id]) {
        groups[category.id] = {
          main: category,
          subcategories: []
        };
      }
    } else {
      // Subcategory
      const parentId = category.parent_id;
      if (!groups[parentId]) {
        groups[parentId] = {
          main: { id: parentId, name: 'Loading...' },
          subcategories: []
        };
      }
      groups[parentId].subcategories.push(category);
    }
    return groups;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {product ? 'Modifier le Produit' : 'Ajouter un Produit'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {Object.values(groupedCategories).map((group) => (
                    <optgroup key={group.main.id} label={group.main.name}>
                      {/* Main category option */}
                      <option value={group.main.id}>
                        {group.main.name} (Catégorie principale)
                      </option>
                      {/* Subcategory options */}
                      {group.subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          → {subcategory.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choisissez une sous-catégorie de préférence pour plus de précision
                </p>
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
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (€) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ancien Prix (€)
                </label>
                <input
                  type="number"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix de Livraison (€)
              </label>
              <input
                type="number"
                name="delivery_price"
                value={formData.delivery_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLs des Images (une par ligne)
              </label>
              <textarea
                value={imageUrls}
                onChange={handleImageUrlsChange}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Entrez une URL d'image par ligne
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : (product ? 'Modifier' : 'Ajouter')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal; 