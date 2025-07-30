import React, { useState } from 'react';
import { updateOrderStatus } from '../lib/supabase';

const OrderModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(order?.status || 'Nouvelle');

  const statusOptions = [
    'Nouvelle',
    'En traitement',
    'Expédiée',
    'Livrée',
    'Annulée'
  ];

  const statusColors = {
    'Nouvelle': 'blue',
    'En traitement': 'yellow',
    'Expédiée': 'green',
    'Livrée': 'green',
    'Annulée': 'red'
  };

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;

    setLoading(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Commande #{order.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Statut de la Commande</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full text-${statusColors[order.status]}-800 bg-${statusColors[order.status]}-100`}>
                  {order.status}
                </span>
                <div className="flex items-center space-x-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {newStatus !== order.status && (
                    <button
                      onClick={handleStatusUpdate}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Informations Client</h3>
                <div className="space-y-2">
                  <p><strong>Nom:</strong> {order.customer_details?.fullName || 'Non spécifié'}</p>
                  <p><strong>Téléphone:</strong> {order.customer_details?.phoneNumber || 'Non spécifié'}</p>
                  <p><strong>Adresse:</strong> {order.customer_details?.address || 'Non spécifiée'}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Détails de la Commande</h4>
                <p><strong>ID:</strong> #{order.id}</p>
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString('fr-FR')}</p>
                <p><strong>Total:</strong> {order.total_amount?.toFixed(2)} TND</p>
                <p><strong>Statut:</strong> {order.status}</p>
              </div>
            </div>

            {/* Product Details */}
            {order.form_data && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Produit Commandé</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Produit:</strong> {order.form_data.product_name || 'Non spécifié'}</p>
                      <p><strong>Quantité:</strong> {order.form_data.quantity || 1}</p>
                    </div>
                    <div>
                      <p><strong>Prix unitaire:</strong> {order.form_data.unit_price?.toFixed(2)} TND</p>
                      <p><strong>Sous-total:</strong> {order.form_data.subtotal?.toFixed(2)} TND</p>
                      <p><strong>Livraison:</strong> {order.form_data.delivery_price?.toFixed(2)} TND</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Order Data (for debugging) */}
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700">
                Données brutes (pour développement)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(order, null, 2)}
              </pre>
            </details>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal; 