import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Ajuste o caminho se necessário
import { useAuth } from '../contexts/AuthContext'; // Para obter a unidade do usuário

const OrdersModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(['all']);
  const { user } = useAuth(); // Obter o usuário para filtrar pela unidade

  // Status disponíveis para filtro
  const availableStatuses = [
    { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-800' },
    { value: 'Pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Em Preparação', label: 'Em Preparação', color: 'bg-blue-100 text-blue-800' },
    { value: 'A caminho', label: 'A caminho', color: 'bg-purple-100 text-purple-800' },
    { value: 'Entregue', label: 'Entregue', color: 'bg-green-100 text-green-800' },
    { value: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];
  const formatDate = (date, includeTime = false) => {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('pt-BR', options);
  };

  // Função para filtrar pedidos por status
  const filterOrdersByStatus = useCallback((ordersToFilter) => {
    if (selectedStatuses.includes('all')) {
      return ordersToFilter;
    }
    return ordersToFilter.filter(order => selectedStatuses.includes(order.status));
  }, [selectedStatuses]);

  // Função para alternar seleção de status
  const toggleStatusFilter = (status) => {
    if (status === 'all') {
      setSelectedStatuses(['all']);
    } else {
      setSelectedStatuses(prev => {
        const newStatuses = prev.filter(s => s !== 'all');
        if (newStatuses.includes(status)) {
          const filtered = newStatuses.filter(s => s !== status);
          return filtered.length === 0 ? ['all'] : filtered;
        } else {
          return [...newStatuses, status];
        }
      });
    }
  };
  // Atualizar pedidos filtrados quando os pedidos ou filtros mudarem
  useEffect(() => {
    const filtered = filterOrdersByStatus(orders);
    setFilteredOrders(filtered);
  }, [orders, filterOrdersByStatus]);
  // Função para obter a cor do status
  const getStatusColor = (status) => {
    const statusConfig = availableStatuses.find(s => s.value === status);
    return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800';
  };

  // Função para verificar se o pedido está atrasado
  const isOrderDelayed = (order) => {
    if (order.status !== 'Em Preparação') {
      return false;
    }

    if (!order.createdAt) {
      return false;
    }

    const now = new Date();
    const createdAt = order.createdAt;
    const timeDifference = now - createdAt;
    const minutesDifference = timeDifference / (1000 * 60); // Converte para minutos

    return minutesDifference > 15;
  };

  const fetchOrdersByDate = useCallback(async (date) => {
    if (!isOpen || !user || !user.unit) return; // Não buscar se o modal não estiver aberto ou se o usuário/unidade não estiverem definidos

    setIsLoading(true);
    setOrders([]); // Limpa os pedidos anteriores

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('pharmacyUnitId', '==', user.unit), // Filtra pela unidade do usuário
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converte Timestamps para Date objects para facilitar a formatação
        createdAt: doc.data().createdAt?.toDate(),
        date: doc.data().date?.toDate(),
        lastStatusUpdate: doc.data().lastStatusUpdate?.toDate(),
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      // Adicionar feedback para o usuário aqui, se necessário
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, user]); // Adiciona user como dependência
  useEffect(() => {
    if (isOpen) {
      fetchOrdersByDate(currentDate);
    }
  }, [isOpen, currentDate, fetchOrdersByDate]);

  // useEffect para atualizar os badges de "atrasado" a cada minuto
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Força re-renderização para atualizar os badges de "atrasado"
      setFilteredOrders(prevOrders => [...prevOrders]);
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval);
  }, [isOpen]);

  const handlePreviousDay = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };
  const handleNextDay = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const handleClose = () => {
    // Reset filtros quando fechar o modal
    setSelectedStatuses(['all']);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Pedidos do Dia</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex justify-between items-center border-b">
          <button
            onClick={handlePreviousDay}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Dia anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-medium text-gray-700">
            {formatDate(currentDate)}
          </span>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Próximo dia"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Filtros de Status */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map(status => (
              <button
                key={status.value}
                onClick={() => toggleStatusFilter(status.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedStatuses.includes(status.value) || (selectedStatuses.includes('all') && status.value === 'all')
                    ? status.color + ' ring-2 ring-blue-500' 
                    : status.color + ' opacity-50 hover:opacity-75'
                }`}
              >
                {status.label}
                {status.value !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({orders.filter(order => order.status === status.value).length})
                  </span>
                )}
                {status.value === 'all' && (
                  <span className="ml-1 text-xs">({orders.length})</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Mostrando {filteredOrders.length} de {orders.length} pedidos
          </div>
        </div>        
        <div className="overflow-y-auto flex-grow p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando pedidos...</p>
            </div>
          )}
          {!isLoading && filteredOrders.length === 0 && orders.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              Nenhum pedido encontrado para este dia nesta unidade.
            </p>
          )}
          {!isLoading && filteredOrders.length === 0 && orders.length > 0 && (
            <p className="text-center text-gray-500 py-4">
              Nenhum pedido encontrado com os filtros selecionados.
            </p>
          )}          {!isLoading && filteredOrders.map(order => (            <div key={order.id} className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-red-600">Pedido #{order.orderId}</h3>                <div className="flex items-center gap-2">
                  {isOrderDelayed(order) && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                      Atrasado
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700"><strong>Cliente:</strong> {order.customerName}</p>
              <p className="text-sm text-gray-600"><strong>Telefone:</strong> {order.customerPhone}</p>
              <p className="text-sm text-gray-600"><strong>Endereço:</strong> {order.address}</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-700"><strong>Itens:</strong></p>
                <ul className="list-disc list-inside pl-4 text-sm text-gray-600">
                  {order.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>              
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div className="flex flex-col">
                  <span>Vendedor: {order.sellerName || 'N/A'}</span>
                  {order.deliveryManName && (
                    <span className="text-blue-600 font-medium">Entregador: {order.deliveryManName}</span>
                  )}
                </div>
                <span>Criado em: {order.createdAt ? formatDate(order.createdAt, true) : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
