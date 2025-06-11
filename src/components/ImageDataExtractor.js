// src/components/ImageDataExtractor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { useFirebaseOrders } from '../hooks/useFirebaseOrders';
import { extractRelevantData } from '../utils/dataExtractor';
import { ExtractedDataForm } from '../components/ExtractedDataForm';
import { Upload, X, Image as ImageIcon, RefreshCw, Ban, Search, List } from 'lucide-react';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { fullConnectivityCheck } from '../utils/connectivityChecker';
import CancelOrderModal from '../components/CancelOrderModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import SuccessOrderModal from '../components/SuccessOrderModal';
import OrdersModal from '../components/OrdersModal';
import SearchOrdersModal from '../components/SearchOrdersModal';
import logo from '../assets/logo.png';
import UserSwitcher from './UserSwitcher';

const ImageDataExtractor = () => {
  const fileInputRef = useRef(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSearchOrdersModalOpen, setIsSearchOrdersModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');  const [extractedData, setExtractedData] = useState({
    clientName: '',
    phone: '',
    address: '',
    products: [],
    totalValue: '',
    orderId: '',
    whatsappLocation: ''
  });
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  const { user, activeUsers } = useAuth();
  const { processImage, isProcessing, currentProcessingIndex } = useImageProcessing(
    process.env.REACT_APP_AZURE_ENDPOINT,
    process.env.REACT_APP_AZURE_API_KEY
  );
  const { saveOrder, cancelOrder, isSaving, isCancelling, generateEasyOrderId } = useFirebaseOrders(user);

  const allUsersAreManagers = () => {
    if (!activeUsers || activeUsers.length === 0) return false;
    return activeUsers.every(
      activeUser => activeUser.role === 'manager' || activeUser.role === 'admin'
    );
  };

  const preprocessImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: file.lastModified
            });
            resolve(processedFile);
          }, 'image/jpeg', 1.0);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
  const handleCancelOrder = async (orderId, reason) => { 
    try {
      await cancelOrder(orderId, reason); 
      setIsCancelModalOpen(false);
      alert('Pedido cancelado com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert(error.message || 'Erro ao cancelar o pedido. Por favor, tente novamente.');
    }  };
  
  const handleOrderSelect = (order) => {
    // Quando um pedido é selecionado na busca, fecha o modal
    setIsSearchOrdersModalOpen(false);
    // Aqui você pode adicionar lógica adicional se necessário
    console.log('Pedido selecionado:', order);
  };
  
  const resetForm = () => {    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      setImageFiles([]);      setExtractedData({
        clientName: '',
        phone: '',
        address: '',
        products: [],
        totalValue: '',
        orderId: ''
      });
      setProcessingProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const processFiles = async (files) => {
    setImageFiles(prev => [...prev, ...files]);
    setProcessingProgress({ current: 0, total: files.length });
  
    try {
      let currentData = { ...extractedData };
      
      // MODIFICAÇÃO 1: Gerar novo orderId apenas se não existir um ou se o formulário estiver "limpo"
      let orderIdToUse = currentData.orderId;
      if (!orderIdToUse) { // Gera novo ID apenas se currentData.orderId estiver vazio (novo pedido / após reset)
        orderIdToUse = await generateEasyOrderId();
      }
      currentData.orderId = orderIdToUse;
      
      for (let i = 0; i < files.length; i++) {
        try {
          const extractedText = await processImage(files[i]);
          console.log('TEXTO BRUTO EXTRAÍDO PELO OCR:', extractedText);
          
          // Passa currentData (que agora tem o orderIdToUse) para extractRelevantData
          const newData = extractRelevantData(extractedText, currentData); 
            currentData = {
            clientName: newData.clientName || currentData.clientName,
            phone: newData.phone || currentData.phone,
            address: newData.address || currentData.address,
            // MODIFICAÇÃO 2: Usar diretamente newData.products
            products: newData.products, 
            totalValue: newData.totalValue || currentData.totalValue,
            orderId: orderIdToUse, // Garante que o orderIdToUse seja mantido
            whatsappLocation: currentData.whatsappLocation // Mantém o campo de localização
          };
  
          setExtractedData(currentData);
          
          const priceNumber = parseFloat(currentData.totalValue.replace(',', '.'));
          console.log('DADOS QUE SERÃO ENVIADOS PARA O FIREBASE:', {
            address: currentData.address,
            customerName: currentData.clientName,
            customerPhone: currentData.phone,
            orderId: currentData.orderId,
            itemCount: currentData.products.length,
            items: currentData.products,
            price: `R$ ${isNaN(priceNumber) ? '0.00' : priceNumber.toFixed(2)}`,
            priceNumber: isNaN(priceNumber) ? 0 : priceNumber,
          });
          
          console.log('PRODUTOS IDENTIFICADOS:', currentData.products);
        } catch (error) {
          console.error(`Erro ao processar imagem ${i + 1}:`, error);
          alert(`Erro ao processar a imagem ${files[i].name}. Verifique o console para mais detalhes.`);
        }
  
        setProcessingProgress(prev => ({ ...prev, current: i + 1 }));
      }
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      alert('Ocorreu um erro ao processar as imagens. Por favor, tente novamente.');
    } finally {
      setProcessingProgress({ current: 0, total: 0 });
    }
  };

  useEffect(() => {
    const handlePaste = async (event) => {
      // Allow default paste behavior for inputs, textareas, etc.
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return;
      }
      
      event.preventDefault(); // Prevent default only if not pasting into an input/textarea
      
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      const imageFiles = [];

      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          // Check if getAsFile returned a valid file object
          if (file) {
            const processedFile = await preprocessImage(file);
            imageFiles.push(processedFile);
          } else {
            console.warn('Could not get file from clipboard item:', item);
          }
        }
      }

      if (imageFiles.length > 0) {
        await processFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const hasValidData = () => {
    const hasBasicInfo = extractedData.clientName.trim() || 
                        extractedData.phone.trim() || 
                        extractedData.address.trim();
    
    const hasOrderInfo = extractedData.products.length > 0 || 
                        extractedData.totalValue.trim();

    return hasBasicInfo && hasOrderInfo;
  };

  const isFormValid = () => {
    return (
      extractedData.clientName.trim() !== '' &&
      extractedData.phone.trim() !== '' &&
      extractedData.address.trim() !== '' &&
      extractedData.products.length > 0 &&
      extractedData.totalValue.trim() !== '' &&
      extractedData.orderId.trim() !== '' &&
      extractedData.products.every(product => product.trim() !== '')
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files)
      .filter(file => file.type.startsWith('image/'));
      
    if (files.length) {
      const processedFiles = await Promise.all(
        files.map(file => preprocessImage(file))
      );
      await processFiles(processedFiles);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    const processedFiles = await Promise.all(
      files.map(file => preprocessImage(file))
    );
    await processFiles(processedFiles);
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };
  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    if (imageFiles.length === 1) {
      setExtractedData({
        clientName: '',
        phone: '',
        address: '',
        products: [],
        totalValue: '',
        orderId: '',
        whatsappLocation: ''
      });
    }
  };const handleSave = async () => {
    if (!isFormValid()) {
      alert('Por favor, preencha todos os campos obrigatórios antes de confirmar o pedido.');
      return;
    }

    console.log('🚀 Iniciando processo de salvamento do pedido');

    // Verificar conectividade antes de tentar salvar
    console.log('🌐 Verificando conectividade...');
    const connectivity = await fullConnectivityCheck();
    
    if (!connectivity.isOnline) {
      alert('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      return;
    }
    
    if (!connectivity.firebaseConnected) {
      alert('Problema de conexão com o banco de dados. Tente novamente em alguns instantes.');
      return;
    }
    
    console.log('✅ Conectividade confirmada, prosseguindo com salvamento');

    try {
      const orderId = await saveOrder(extractedData);
      console.log(`✅ SaveOrder retornou orderId: ${orderId}`);
      
      // Fazer uma verificação adicional para garantir que o pedido realmente existe
      // antes de exibir a mensagem de sucesso
      try {
        console.log(`🔍 Fazendo verificação final da existência do pedido ${orderId}`);
        const docRef = doc(collection(db, 'orders'), orderId);
        const finalVerification = await getDoc(docRef);
        
        if (!finalVerification.exists()) {
          console.error(`❌ Pedido ${orderId} não foi encontrado na verificação final`);
          throw new Error('Pedido não foi encontrado após salvamento - possível falha na rede');
        }
        
        console.log(`🎉 Verificação final confirmada para pedido ${orderId}`);
          // Só limpar o formulário e mostrar sucesso se o pedido realmente existir
        setSuccessOrderId(orderId);
        setImageFiles([]);
        setExtractedData({
          clientName: '',
          phone: '',
          address: '',
          products: [],
          totalValue: '',
          orderId: '',
          whatsappLocation: ''
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        setIsSuccessModalOpen(true);
        console.log(`✅ Processo de salvamento concluído com sucesso para ${orderId}`);
        
      } catch (verificationError) {
        console.error('❌ Erro na verificação final:', verificationError);
        alert('ATENÇÃO: Erro na verificação do salvamento. Por favor, verifique manualmente se o pedido foi realmente criado antes de prosseguir. Use a função "Verificar Pedido" para confirmar.');
      }
      
    } catch (error) {
      console.error('❌ Erro no processo de salvamento:', error);
      // A mensagem de erro de duplicidade já é tratada no hook useFirebaseOrders com um alert.
      // Se o erro não for o de duplicidade, mostra um alerta genérico.
      if (error.message !== 'Esse pedido já foi cadastrado há menos de 20 minutos atrás') {
        alert('Erro ao salvar os dados. Por favor, tente novamente.');
      }    } finally {
      // O estado isSaving será resetado pelo hook após todo o processo
      console.log('🔄 Processo de salvamento finalizado no componente');
    }
  };

  const formatName = (fullName) => {
    if (!fullName) return 'Usuário';
    return fullName.split(' ').slice(0, 2).join(' ');
  };
  const getButtonText = () => {
    if (isSaving) return 'Salvando no Sistema...';
    if (!isFormValid()) return 'Preencha todos os campos para confirmar';
    return 'Confirmar Pedido';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg border border-[#E2E8F0] transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between mb-8">
        <img 
          src={logo} 
          alt="Logo" 
          className="h-10 sm:h-12 object-contain"
        />
        <h2 className="text-2xl sm:text-3xl font-light text-[red] text-center order-first sm:order-none">
          {user.unit}
        </h2>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={resetForm}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-300 text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Limpar</span>
          </button>
          <UserSwitcher />
        </div>
      </div>
  
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-[#2D3748] text-center">
        Olá, {formatName(user.displayName)}
      </h2>
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
          LANÇAR PEDIDO NO APP
        </h2>
          <div className="flex items-center gap-2">          <button
            onClick={() => setIsSearchOrdersModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors duration-300 text-sm sm:text-base"
          >
            <Search size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Buscar Pedido</span>
          </button>
          <button
            onClick={() => setIsOrdersModalOpen(true)} // Open OrdersModal
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors duration-300 text-sm sm:text-base"
            title="Ver todos os pedidos do dia"
          >
            <List size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Listar pedidos</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-6 sm:space-y-8">
        <div
          className={`relative border-2 border-dashed rounded-xl p-4 sm:p-8 transition-all duration-300 ${
            isDragging
              ? 'border-[#e41c26] bg-red-50'
              : imageFiles.length
              ? 'border-[#48BB78] bg-green-50'
              : 'border-[#E2E8F0] hover:border-[#e41c26] hover:bg-red-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            multiple
            className="hidden"
          />
          
          <div 
            className="text-center cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${
                imageFiles.length ? 'text-[#48BB78]' : 'text-[#e41c26]'
              }`}
            />
            <p className="text-base sm:text-lg font-medium text-[#2D3748] mb-2">
              {imageFiles.length
                ? 'Clique para adicionar mais imagens'
                : 'Arraste imagens ou clique para selecionar'}
            </p>
            <p className="text-xs sm:text-sm text-[#718096] mb-2">
              Suporta JPG, PNG e GIF
            </p>
            <p className="text-xs sm:text-sm text-[#e41c26] font-medium px-2">
              Você também pode usar Ctrl+V para colar imagens
            </p>
          </div>
        </div>
  
        {imageFiles.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#2D3748]">
                Imagens carregadas
              </h3>
              <span className="text-xs sm:text-sm text-[#718096]">
                {imageFiles.length} {imageFiles.length === 1 ? 'imagem' : 'imagens'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {imageFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 sm:p-2 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
  
        {isProcessing && (
          <div className="text-center py-4 sm:py-6">
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#e41c26] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(processingProgress.current / processingProgress.total) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-[#e41c26] border-t-transparent mx-auto mb-4"></div>
            <p className="text-base sm:text-lg font-medium text-[#e41c26]">
              Processando imagem {processingProgress.current + 1} de {processingProgress.total}...
            </p>
          </div>
        )}
  
        {!isProcessing && hasValidData() && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <ExtractedDataForm
              data={extractedData}
              onUpdate={setExtractedData}
            />
  
            <button
              onClick={handleSave}
              disabled={isSaving || !isFormValid()}
              className={`w-full py-3 px-4 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 ${
                isFormValid()
                  ? 'bg-[#e41c26] hover:bg-[#b81219] text-white shadow-lg hover:shadow-xl disabled:bg-[#ff4d54]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {getButtonText()}
            </button>
          </div>
        )}
  
        {!isProcessing && !hasValidData() && imageFiles.length > 0 && (
          <div className="text-center py-4 sm:py-6">
            <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium text-yellow-600">
              Nenhum dado foi extraído das imagens.
              <br />
              Por favor, tente novamente com outras imagens.
            </p>
          </div>
        )}
  
        {allUsersAreManagers() && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Cancelar Pedido
              </h3>
              <p className="text-sm text-center text-gray-500 mb-4">
                Cancele um pedido existente no sistema
              </p>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
              >
                <Ban size={16} />
                <span>Cancelar Pedido</span>
              </button>
            </div>
          </div>
        )}
      </div> {/* Closing tag for space-y-6 sm:space-y-8 */}

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onCancel={handleCancelOrder}
        isProcessing={isCancelling}
      />
        <SuccessOrderModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        orderId={successOrderId}
      />
      
      <OrdersModal 
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
      />
      
      <SearchOrdersModal
        isOpen={isSearchOrdersModalOpen}
        onClose={() => setIsSearchOrdersModalOpen(false)}
        onOrderSelect={handleOrderSelect}
      />
    </div> // Closing tag for the main container div
  );
};

export default ImageDataExtractor;
