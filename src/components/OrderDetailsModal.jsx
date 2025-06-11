import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, User, Package, Clock, AlertTriangle, Truck } from 'lucide-react';
import { useFirebaseOrders } from '../hooks/useFirebaseOrders';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const OrderDetailsModal = ({ isOpen, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [targetUnit, setTargetUnit] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);
    const { user } = useAuth();
  const { getOrderDetails, cancelOrder, transferOrderDelivery, isCancelling, isTransferring } = useFirebaseOrders(user);
  // Carregar unidades disponíveis do Firebase
  const loadAvailableUnits = async () => {
    try {
      const unitsCollectionRef = collection(db, 'pharmacyUnits');
      const querySnapshot = await getDocs(unitsCollectionRef);
      const fetchedUnits = [];
      querySnapshot.forEach((doc) => {
        fetchedUnits.push({
          id: doc.id,
          name: doc.id // Usar apenas o ID do documento
        });
      });
      setAvailableUnits(fetchedUnits);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      setAvailableUnits([]);
    }
  };

  const loadOrderDetails = async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError('');
    
    try {
      const details = await getOrderDetails(orderId);
      if (details) {
        setOrderDetails(details);
      } else {
        setError('Pedido não encontrado ou você não tem permissão para visualizá-lo.');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do pedido:', err);
      setError('Erro ao carregar os detalhes do pedido.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
    if (isOpen) {
      loadAvailableUnits();
    }
  }, [isOpen, orderId]);

  const handleClose = () => {
    setOrderDetails(null);
    setError('');
    setCancelReason('');
    setShowCancelForm(false);
    setShowTransferForm(false);
    setTargetUnit('');
    onClose();
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    try {
      await cancelOrder(orderId, cancelReason);
      alert('Pedido cancelado com sucesso!');
      setShowCancelForm(false);
      await loadOrderDetails(); // Recarregar detalhes
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('Erro ao cancelar o pedido. Tente novamente.');
    }
  };

  const handleTransferOrder = async () => {
    if (!targetUnit) {
      alert('Por favor, selecione a unidade de destino.');
      return;
    }

    try {
      await transferOrderDelivery(orderId, targetUnit);
      alert('Pedido transferido com sucesso!');
      setShowTransferForm(false);
      await loadOrderDetails(); // Recarregar detalhes
    } catch (error) {
      console.error('Erro ao transferir pedido:', error);
      alert('Erro ao transferir o pedido. Tente novamente.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Data não disponível';
    try {
      return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (err) {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Em Preparação':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A caminho':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Entregue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const canCancel = isManager && orderDetails?.status !== 'Cancelado' && orderDetails?.status !== 'Entregue';
  const canTransfer = orderDetails?.status !== 'Cancelado' && orderDetails?.status !== 'Entregue';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            Detalhes do Pedido {orderId ? `#${orderId}` : ''}
          </h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando detalhes do pedido...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {orderDetails && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(orderDetails.status)}`}>
                  {orderDetails.status}
                </span>
                <div className="text-sm text-gray-500">
                  <Clock size={16} className="inline mr-1" />
                  Criado em: {formatDate(orderDetails.createdAt)}
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User size={20} className="mr-2 text-blue-600" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome:</p>
                    <p className="font-medium">{orderDetails.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone:</p>
                    <p className="font-medium flex items-center">
                      <Phone size={16} className="mr-1" />
                      {orderDetails.customerPhone}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Endereço:</p>
                    <p className="font-medium flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {orderDetails.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Package size={20} className="mr-2 text-green-600" />
                  Itens do Pedido
                </h3>
                <div className="space-y-2">
                  {orderDetails.items?.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <p className="font-medium">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-lg font-semibold">
                    Total: {orderDetails.price || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Informações do Vendedor */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Informações da Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vendedor:</p>
                    <p className="font-medium">{orderDetails.sellerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unidade:</p>
                    <p className="font-medium">{orderDetails.pharmacyUnitId || 'N/A'}</p>
                  </div>
                  {orderDetails.deliveryPharmacyUnitId && (
                    <div>
                      <p className="text-sm text-gray-600">Unidade de Entrega:</p>
                      <p className="font-medium text-purple-600">{orderDetails.deliveryPharmacyUnitId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Status */}
              {orderDetails.statusHistory && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Histórico de Status</h3>
                  <div className="space-y-2">
                    {orderDetails.statusHistory.map((status, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                        <span className="font-medium">{status.status}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(status.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}              {/* Ações para Gerentes e Atendentes */}
              {(canCancel || canTransfer) && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <AlertTriangle size={20} className="mr-2 text-yellow-600" />
                      {isManager ? 'Ações do Gerente' : 'Ações Disponíveis'}
                    </h3>
                    <div className="flex gap-3">
                      {canCancel && (
                        <button
                          onClick={() => setShowCancelForm(true)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Cancelando...' : 'Cancelar Pedido'}
                        </button>
                      )}
                      {canTransfer && (
                        <button
                          onClick={() => setShowTransferForm(true)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                          disabled={isTransferring}
                        >
                          <Truck size={16} className="mr-1" />
                          {isTransferring ? 'Transferindo...' : 'Transferir Entrega'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Formulário de Cancelamento */}
              {showCancelForm && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold mb-3 text-red-800">Cancelar Pedido</h4>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Informe o motivo do cancelamento..."
                    className="w-full p-3 border border-red-300 rounded-lg resize-none"
                    rows="3"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleCancelOrder}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      disabled={isCancelling}
                    >
                      Confirmar Cancelamento
                    </button>
                    <button
                      onClick={() => setShowCancelForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário de Transferência */}
              {showTransferForm && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold mb-3 text-purple-800">Transferir Entrega</h4>
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full p-3 border border-purple-300 rounded-lg mb-3"
                  >
                    <option value="">Selecione a unidade de destino...</option>
                    {availableUnits
                      .filter(unit => unit.id !== user?.unit)
                      .map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))
                    }
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={handleTransferOrder}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                      disabled={isTransferring}
                    >
                      Confirmar Transferência
                    </button>
                    <button
                      onClick={() => setShowTransferForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
