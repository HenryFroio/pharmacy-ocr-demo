// src/utils/connectivityChecker.js
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Verifica a conectividade com o Firebase antes de operações críticas
 * @returns {Promise<boolean>} - true se conectado, false se houver problemas
 */
export const checkFirebaseConnectivity = async () => {
  try {
    // Tenta fazer uma operação simples no Firestore
    const testDoc = doc(db, '_connectivity_test', 'test');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.error('Teste de conectividade falhou:', error);
    return false;
  }
};

/**
 * Verifica a conectividade geral com a internet
 * @returns {Promise<boolean>} - true se conectado, false se offline
 */
export const checkInternetConnectivity = async () => {
  try {
    // Verifica se o navigator está online
    if (!navigator.onLine) {
      return false;
    }
    
    // Faz uma requisição simples para verificar conectividade real
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    console.error('Teste de conectividade com internet falhou:', error);
    return false;
  }
};

/**
 * Executa uma verificação completa de conectividade
 * @returns {Promise<{isOnline: boolean, firebaseConnected: boolean, message: string}>}
 */
export const fullConnectivityCheck = async () => {
  const isOnline = await checkInternetConnectivity();
  const firebaseConnected = isOnline ? await checkFirebaseConnectivity() : false;
  
  let message = '';
  if (!isOnline) {
    message = 'Sem conexão com a internet';
  } else if (!firebaseConnected) {
    message = 'Problema de conexão com o banco de dados';
  } else {
    message = 'Conectado';
  }
  
  return {
    isOnline,
    firebaseConnected,
    message
  };
};
