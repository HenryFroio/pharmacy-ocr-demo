// src/utils/orderLogger.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registra operações de pedido em uma coleção de backup/auditoria separada
 * @param {string} action - A ação realizada (created, updated, deleted, error)
 * @param {string} orderId - ID do pedido
 * @param {object} orderData - Dados do pedido
 * @param {object} user - Usuário que realizou a ação
 * @param {string} [errorDetails] - Detalhes do erro (se houver)
 * @returns {Promise<string>} - ID do documento de log criado
 */
export const logOrderOperation = async (action, orderId, orderData, user, errorDetails = null) => {
  try {
    // Dados a serem registrados no log
    const logData = {
      action,
      orderId,
      timestamp: serverTimestamp(),
      customerName: orderData?.customerName || orderData?.clientName || '',
      address: orderData?.address || '',
      userId: user?.uid || 'sistema',
      userName: user?.displayName || 'Sistema Automatizado',
      originalOrderId: orderData?.originalOrderId || '',
      pharmacyUnitId: orderData?.pharmacyUnitId || user?.unit || '',
      totalValue: orderData?.price || orderData?.totalValue || '',
      errorDetails,
      // Dados adicionais para diagnóstico
      itemCount: orderData?.items?.length || orderData?.products?.length || 0,
      orderSnapshot: {
        // Versão simplificada dos dados do pedido para referência futura
        customerName: orderData?.customerName || orderData?.clientName || '',
        address: orderData?.address || '',
        phone: orderData?.customerPhone || orderData?.phone || '',
        items: orderData?.items || orderData?.products || [],
        price: orderData?.price || orderData?.totalValue || '',
        status: orderData?.status || 'Novo'
      }
    };

    // Adiciona o log à coleção order_logs
    const docRef = await addDoc(collection(db, 'order_logs'), logData);
    console.log(`Log de pedido criado: ${docRef.id} para o pedido ${orderId}`);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar log de pedido:', error);
    // Não lançamos o erro para evitar que atrapalhe o fluxo principal
    return null;
  }
};