import { useState } from 'react';
import { collection, setDoc, doc, serverTimestamp, Timestamp, getDoc, updateDoc, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { logOrderOperation } from '../utils/orderLogger';

export const useFirebaseOrders = (user) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false); // Add state for transfer

  // Função para gerar um ID fácil de digitar para o pedido
  // Novo formato: 6 caracteres, misturando letras e números, sem prefixo de data
  const generateEasyOrderId = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 1, 0 para evitar confusão
    const idLength = 6;
    let attempts = 0;
    const maxAttempts = 20;
    let newOrderId = '';
    let idExists = true;

    while (idExists && attempts < maxAttempts) {
      // Gera um ID aleatório de 6 caracteres
      newOrderId = Array.from({ length: idLength }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const docRef = doc(collection(db, 'orders'), newOrderId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        idExists = false;
      } else {
        attempts++;
      }
    }

    // Se não conseguir um único após várias tentativas, adiciona mais um caractere
    if (idExists) {
      newOrderId += chars[Math.floor(Math.random() * chars.length)];
    }
    return newOrderId;
  };
  const saveOrder = async (extractedData) => {
    if (!extractedData) return;

    setIsSaving(true);
    
    // Log inicial detalhado
    console.log('🔄 Iniciando salvamento do pedido:', {
      clientName: extractedData.clientName,
      orderId: extractedData.orderId,
      user: user?.displayName,
      unit: user?.unit,
      timestamp: new Date().toISOString(),
      itemCount: extractedData.products?.length || 0
    });
    
    try {
      // Check for duplicate orders
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('createdAt', '>=', Timestamp.fromDate(twentyMinutesAgo)));
      const querySnapshot = await getDocs(q);

      const newOrderPriceNumber = parseFloat(extractedData.totalValue.replace(',', '.'));

      for (const doc of querySnapshot.docs) {
        const existingOrder = doc.data();
        const existingOrderPriceNumber = existingOrder.priceNumber;

        // Deep compare items array
        const itemsMatch = existingOrder.items.length === extractedData.products.length &&
          existingOrder.items.every((item, index) =>
            item.name === extractedData.products[index].name &&
            item.quantity === extractedData.products[index].quantity &&
            item.price === extractedData.products[index].price
          );        if (
          existingOrder.customerName === extractedData.clientName &&
          existingOrder.address === extractedData.address &&
          itemsMatch &&
          existingOrderPriceNumber === newOrderPriceNumber
        ) {
          setIsSaving(false);
          const errorMessage = 'Esse pedido já foi cadastrado há menos de 20 minutos atrás';
          
          // Log do pedido duplicado
          await logOrderOperation('duplicate', extractedData.orderId || 'UNKNOWN', extractedData, user, 
            `Pedido duplicado detectado. Pedido existente: ${existingOrder.orderId}`);
          
          console.warn('⚠️ Pedido duplicado detectado:', {
            existingOrderId: existingOrder.orderId,
            clientName: extractedData.clientName,
            timestamp: new Date().toISOString()
          });
          
          alert(errorMessage);
          throw new Error(errorMessage);
        }
      }      // Se o ID foi fornecido externamente, checa se já existe
      // Garante que o orderId nunca sobrescreva um existente
      let orderId = extractedData.orderId;
      if (orderId) {
        console.log(`🔍 Verificando se orderId fornecido já existe: ${orderId}`);
        const docRef = doc(collection(db, 'orders'), orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Se já existe, gera um novo ID único
          console.log(`⚠️ OrderId ${orderId} já existe, gerando novo ID`);
          orderId = await generateEasyOrderId();
          console.log(`✅ Novo orderId gerado: ${orderId}`);
        } else {
          console.log(`✅ OrderId ${orderId} está disponível`);
        }
      } else {
        console.log('🆔 Gerando novo orderId');
        orderId = await generateEasyOrderId();
        console.log(`✅ OrderId gerado: ${orderId}`);
      }

      const timestamp = serverTimestamp();
      const currentTimestamp = Timestamp.now();
      const priceNumber = parseFloat(extractedData.totalValue.replace(',', '.'));

      // Salvamos o número do orçamento original como referência
      const originalOrderId = extractedData.orderId;      // Gera um ID de pedido fácil de digitar e único
      const orderData = {
        address: extractedData.address,
        createdAt: timestamp,
        customerName: extractedData.clientName,
        customerPhone: extractedData.phone,
        date: timestamp,
        orderId: orderId, // ID fácil de digitar
        originalOrderId: originalOrderId, // Número do orçamento original
        isDelivered: false,
        isInDelivery: false,
        isInPreparation: true,
        isPending: false,
        itemCount: extractedData.products.length,
        items: extractedData.products,
        lastStatusUpdate: timestamp,
        location: extractedData.whatsappLocation || null, // Usa o link do WhatsApp se fornecido
        pharmacyUnitId: user?.unit || '',
        price: `R$ ${priceNumber.toFixed(2)}`,
        priceNumber: priceNumber,
        status: "Em Preparação",
        statusHistory: [
          { status: "Pendente", timestamp: currentTimestamp },
          { status: "Em Preparação", timestamp: currentTimestamp }
        ],
        updatedAt: timestamp,
        sellerId: user?.uid || '',
        sellerName: user?.displayName || 'Usuário não identificado'
      };      try {
        // Usando o ID que geramos como ID do documento
        console.log(`💾 Iniciando salvamento no Firebase com orderId: ${orderId}`);
        const docRef = doc(collection(db, 'orders'), orderId);
        await setDoc(docRef, orderData);
        console.log(`✅ SetDoc executado com sucesso para ${orderId}`);
        
        // Verifica se o pedido foi realmente salvo (redundância de segurança)
        console.log(`🔍 Verificando se o pedido ${orderId} foi realmente salvo`);
        const savedDoc = await getDoc(docRef);
        
        if (!savedDoc.exists()) {
          console.error(`❌ Pedido ${orderId} não foi encontrado após setDoc`);
          // Log do erro
          await logOrderOperation('error', orderId, orderData, user, 'Falha na verificação do salvamento - documento não encontrado após setDoc');
          throw new Error('Falha ao verificar o salvamento do pedido');
        }
        
        console.log(`✅ Pedido ${orderId} confirmado no banco de dados`);
        // Log de sucesso
        await logOrderOperation('created', orderId, { ...orderData, ...savedDoc.data() }, user);
        console.log(`🎉 Pedido ${orderId} salvo com sucesso e verificado.`);
        return orderId;      } catch (error) {
        console.error(`❌ Erro ao salvar pedido ${orderId}:`, error);
        // Log do erro
        await logOrderOperation('error', orderId, orderData, user, `Primeira tentativa falhou: ${error.message}`);
        
        // Tenta novamente uma vez em caso de falha na rede
        try {
          console.log(`🔄 Tentando salvar novamente o pedido ${orderId}...`);
          const docRef = doc(collection(db, 'orders'), orderId);
          await setDoc(docRef, orderData);
          console.log(`✅ Segunda tentativa de setDoc executada para ${orderId}`);
          
          // Verifica se o pedido foi realmente salvo na segunda tentativa
          const savedDoc = await getDoc(docRef);
          
          if (!savedDoc.exists()) {
            console.error(`❌ Pedido ${orderId} não foi encontrado após segunda tentativa`);
            // Log do erro na segunda tentativa
            await logOrderOperation('error', orderId, orderData, user, 'Falha na verificação do salvamento - segunda tentativa também falhou');
            throw new Error('Falha ao verificar o salvamento do pedido na segunda tentativa');
          }
          
          console.log(`🎉 Pedido ${orderId} salvo com sucesso na segunda tentativa`);
          // Log de sucesso na segunda tentativa
          await logOrderOperation('created', orderId, { ...orderData, ...savedDoc.data() }, user, 'Sucesso na segunda tentativa');
          console.log(`Pedido ${orderId} salvo com sucesso na segunda tentativa.`);
          return orderId;
        } catch (retryError) {
          console.error(`💥 Falha definitiva ao salvar pedido ${orderId}:`, retryError);
          // Log do erro final
          await logOrderOperation('error', orderId, orderData, user, `Falha após múltiplas tentativas: ${retryError.message}`);
          throw new Error('Falha ao salvar o pedido após múltiplas tentativas');
        }
      }    } finally {
      // Resetar isSaving apenas após todo o processo estar completo
      // Importante: este finally sempre executa, mas o estado só é resetado
      // depois que todas as verificações foram feitas
      console.log('🔄 Finalizando processo de salvamento');
      setIsSaving(false);
    }
  };
  const cancelOrder = async (orderId, reason) => {
    if (!orderId || !reason) {
      throw new Error('O motivo do cancelamento é obrigatório.');
    }

    setIsCancelling(true);
    try {
      const docRef = doc(collection(db, 'orders'), orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Pedido não encontrado');
      }

      const orderData = docSnap.data();
      const currentTimestamp = Timestamp.now();
      const timestamp = serverTimestamp();

      const updateData = {
        status: "Cancelado",
        cancelReason: reason,
        isDelivered: false,
        isInDelivery: false,
        isInPreparation: false,
        isPending: false,
        lastStatusUpdate: timestamp,
        updatedAt: timestamp,
        statusHistory: [...orderData.statusHistory, {
          status: "Cancelado",
          reason: reason,
          timestamp: currentTimestamp
        }]
      };

      await updateDoc(docRef, updateData);
      
      // Log do cancelamento
      await logOrderOperation('cancelled', orderId, { ...orderData, ...updateData }, user, `Cancelado por: ${reason}`);
      
      return orderId;
    } catch (error) {
      // Log do erro no cancelamento
      await logOrderOperation('error', orderId, null, user, `Erro ao cancelar: ${error.message}`);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };
  const getOrderDetails = async (orderId) => {
    if (!orderId) return null;

    setIsFetching(true);
    try {
      const docRef = doc(collection(db, 'orders'), orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const orderData = docSnap.data();
      
      // Verificar se o pedido pertence à unidade do usuário logado
      if (orderData.pharmacyUnitId !== user?.unit) {
        console.warn(`Acesso negado: Pedido ${orderId} não pertence à unidade ${user?.unit}`);
        return null;
      }

      return orderData;
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      throw new Error('Erro ao buscar detalhes do pedido');
    } finally {
      setIsFetching(false);
    }
  };

  const findOrderById = async (orderId) => {
    if (!orderId) return null;

    setIsFetching(true);
    try {
      const docRef = doc(collection(db, 'orders'), orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const orderData = docSnap.data();
      
      // Verificar se o pedido pertence à unidade do usuário logado
      if (orderData.pharmacyUnitId !== user?.unit) {
        console.warn(`Acesso negado: Pedido ${orderId} não pertence à unidade ${user?.unit}`);
        return null;
      }

      return {
        id: orderId,
        ...orderData
      };
    } catch (error) {
      console.error('Erro ao buscar pedido por ID:', error);
      throw new Error('Erro ao buscar pedido por ID');
    } finally {
      setIsFetching(false);
    }
  };
  const findOrdersByCustomerInfo = async (customerName, address, phone) => {
    setIsFetching(true);
    const results = [];
    
    try {
      // Buscar pedidos recentes (últimos 30 dias) apenas da unidade do usuário logado
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Buscar na coleção orders filtrando pela unidade do usuário
      const ordersQuery = query(
        collection(db, 'orders'),
        where('pharmacyUnitId', '==', user?.unit || ''),
        orderBy('createdAt', 'desc'),
        limit(100) // Limitar a quantidade de documentos
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Verificar correspondência parcial
        const nameMatch = customerName && data.customerName && 
                         data.customerName.toLowerCase().includes(customerName.toLowerCase());
        const addressMatch = address && data.address &&
                           data.address.toLowerCase().includes(address.toLowerCase());
        const phoneMatch = phone && data.customerPhone &&
                         data.customerPhone.includes(phone);
                         
        if (nameMatch || addressMatch || phoneMatch) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Erro ao buscar pedidos por informações do cliente:', error);
      return [];
    } finally {
      setIsFetching(false);
    }
  };

  const transferOrderDelivery = async (orderId, targetUnitId) => {
    if (!orderId || !targetUnitId) {
      throw new Error('ID do pedido e ID da unidade de destino são obrigatórios.');
    }

    setIsTransferring(true);
    try {
      const docRef = doc(collection(db, 'orders'), orderId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Pedido não encontrado');
      }

      const updateData = {
        deliveryPharmacyUnitId: targetUnitId,
        lastStatusUpdate: serverTimestamp(), // Update timestamp
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      console.log(`Entrega do pedido ${orderId} transferida para a unidade ${targetUnitId}`);
      return orderId;
    } catch (error) {
      console.error('Erro ao transferir entrega do pedido:', error);
      throw error; // Re-throw the error to be handled by the component
    } finally {
      setIsTransferring(false);
    }
  };
  return { 
    saveOrder, 
    cancelOrder, 
    getOrderDetails, 
    findOrderById,
    findOrdersByCustomerInfo,
    transferOrderDelivery, // Export the new function
    isSaving, 
    isCancelling, 
    isFetching, 
    isTransferring, // Export the new state
    generateEasyOrderId 
  };
};
