import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';

const CancelOrderModal = ({ isOpen, onClose, onCancel, isProcessing }) => {
  const [orderId, setOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState(''); // Add state for cancel reason

  if (!isOpen) return null;

  const handleCancel = () => {
    // Pass both orderId and cancelReason
    onCancel(orderId.trim(), cancelReason.trim()); 
    setOrderId('');
    setCancelReason(''); // Reset reason
  };

  const handleClose = () => {
    setOrderId('');
    setCancelReason(''); // Reset reason
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        {/* Botão de fechar */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Cancelar Pedido
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Digite o identificador do pedido que deseja cancelar.
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Identificador do pedido"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Reason Input */}
        <div className="mb-6">
          <textarea
            placeholder="Motivo do cancelamento (obrigatório)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={handleCancel}
            // Disable if orderId or reason is empty
            disabled={!orderId.trim() || !cancelReason.trim() || isProcessing} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            {isProcessing ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
