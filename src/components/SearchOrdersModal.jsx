import React, { useState } from 'react';
import { X, Search, User, Phone, Package, Hash } from 'lucide-react';
import { useFirebaseOrders } from '../hooks/useFirebaseOrders';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderDetailsModal from './OrderDetailsModal';

const SearchOrdersModal = ({ isOpen, onClose, onOrderSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('id'); // 'id', 'name', 'phone', 'both'
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  
  const { user } = useAuth();
  const { findOrdersByCustomerInfo, findOrderById } = useFirebaseOrders(user);
    const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um termo para buscar');
      return;
    }
    
    setIsSearching(true);
    setError('');
    setSearchResults([]);
    
    try {
      let results = [];
      
      if (searchType === 'id') {
        const order = await findOrderById(searchTerm);
        results = order ? [order] : [];
      } else if (searchType === 'name') {
        results = await findOrdersByCustomerInfo(searchTerm, '', '');
      } else if (searchType === 'phone') {
        results = await findOrdersByCustomerInfo('', '', searchTerm);
      } else if (searchType === 'both') {
        results = await findOrdersByCustomerInfo(searchTerm, '', searchTerm);
      }
      
      if (results.length === 0) {
        setError('Nenhum pedido encontrado com os critérios informados');
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Erro ao buscar pedidos. Tente novamente.');
    } finally {
      setIsSearching(false);
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
        return 'bg-yellow-100 text-yellow-800';
      case 'Em Preparação':
        return 'bg-blue-100 text-blue-800';
      case 'A caminho':
        return 'bg-purple-100 text-purple-800';
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
    const handleOrderClick = (order) => {
    setSelectedOrderId(order.orderId || order.id);
    setIsOrderDetailsOpen(true);
  };
    const resetModal = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    setSearchType('id');
  };
  
  const handleClose = () => {
    resetModal();
    onClose();
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Buscar Pedidos</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Search Section */}
        <div className="p-6 border-b space-y-4">          {/* Search Type Selection */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchType('id')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'id' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Hash size={16} />
              Por ID
            </button>
            <button
              onClick={() => setSearchType('name')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'name' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User size={16} />
              Por Nome
            </button>
            <button
              onClick={() => setSearchType('phone')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'phone' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Phone size={16} />
              Por Telefone
            </button>
            <button
              onClick={() => setSearchType('both')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'both' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Search size={16} />
              Busca Geral
            </button>
          </div>
          
          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}              placeholder={
                searchType === 'id' ? 'Digite o ID do pedido...' :
                searchType === 'name' ? 'Digite o nome do cliente...' :
                searchType === 'phone' ? 'Digite o telefone...' :
                'Digite nome ou telefone...'
              }
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2 transition-colors"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search size={18} />
                  Buscar
                </>
              )}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {searchResults.length} pedido(s) encontrado(s)
              </h3>
              
              {searchResults.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Package size={20} className="text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Pedido #{order.orderId}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cliente:</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Telefone:</p>
                      <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Endereço:</p>
                    <p className="text-sm text-gray-600 truncate">{order.address}</p>
                  </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {order.itemCount} item(s) - {order.price}
                      </p>
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500">
                          Vendedor: {order.sellerName || 'N/A'}
                        </p>
                        {order.deliveryManName && (
                          <p className="text-xs text-blue-600 font-medium">
                            Entregador: {order.deliveryManName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Unidade: {order.pharmacyUnitId}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!isSearching && searchResults.length === 0 && !error && (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                Use os filtros acima para buscar pedidos por nome do cliente ou telefone
              </p>
            </div>
          )}        </div>
      </div>
      
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default SearchOrdersModal;
