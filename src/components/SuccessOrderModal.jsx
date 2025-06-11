import React, { useState, useEffect } from 'react';
import { CheckCircle, Copy, X } from 'lucide-react';

/**
 * Modal que exibe uma mensagem de sucesso quando um pedido é criado
 * com ênfase no número do pedido que o vendedor deve informar ao cliente
 */
const SuccessOrderModal = ({ isOpen, onClose, orderId }) => {
  const [copied, setCopied] = useState(false);
  
  // Reset copy state when modal closes
  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);
  
  // Handler para copiar o ID do pedido para o clipboard
  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center text-green-600">
            <CheckCircle className="mr-2" size={24} /> 
            Pedido Criado com Sucesso!
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 text-center">
          <div className="mb-6 flex flex-col items-center justify-center">
            <CheckCircle className="text-green-500 w-20 h-20 mb-4" />
            <p className="text-lg mb-1">O pedido foi registrado com sucesso!</p>
            <p className="text-gray-600">Informe este número ao cliente:</p>
          </div>
          
          {/* Order ID with emphasis */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="bg-green-50 border-2 border-green-500 rounded-lg px-6 py-4 w-full">
              <p className="text-3xl font-bold text-green-700 tracking-wider">{orderId}</p>
            </div>
            <button 
              onClick={handleCopyOrderId}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
              title={copied ? "Copiado!" : "Copiar número do pedido"}
            >
              <Copy size={18} className={copied ? "text-green-700" : "text-green-600"} />
            </button>
          </div>
          
          {/* Copy confirmation */}
          {copied && (
            <div className="text-green-600 text-sm mb-4 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Número do pedido copiado!
            </div>
          )}
            {/* Reminder */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 text-left rounded mb-4">
            <p className="font-medium text-green-800">✅ Pedido Confirmado no Sistema!</p>
            <p className="text-green-700">O pedido foi verificado e está disponível para os entregadores.</p>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left rounded">
            <p className="font-medium text-yellow-800">Importante:</p>
            <p className="text-yellow-700">Lembre-se de informar o número do pedido ao cliente para que ele possa rastrear o status da entrega.</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t text-center">
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessOrderModal;