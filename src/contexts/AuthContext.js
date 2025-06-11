// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore();
const AuthContext = createContext({});

// Generate a browser ID to identify the current browser instance
const getBrowserId = () => {
  let browserId = localStorage.getItem('pharmacy_browser_id');
  if (!browserId) {
    browserId = uuidv4();
    localStorage.setItem('pharmacy_browser_id', browserId);
  }
  return browserId;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [units, setUnits] = useState([]); // Add state for units
  const [loading, setLoading] = useState(true);
  const [showUnitSelection, setShowUnitSelection] = useState(false);
  const browserId = getBrowserId();
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchUserData = async (uid) => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        doc(db, 'users', uid),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            if (userData.role === 'admin' || userData.role === 'attendant' || userData.role === 'manager') {
              resolve({
                uid,
                displayName: userData.displayName,
                email: userData.email,
                unit: userData.unit,
                originalUnit: userData.originalUnit,
                role: userData.role,
                updatedAt: userData.updatedAt?.toDate()
              });
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        },
        (error) => {
          console.error('Erro ao observar documento:', error);
          reject(error);
        }
      );

      return unsubscribe;
    });
  };

  // Fetch active users for this browser
  const fetchActiveUsers = async () => {
    try {
      // Limitar a uma chamada a cada 3 segundos
      const now = Date.now();
      if (now - lastFetchTime < 3000) {
        console.log('Ignorando chamada muito frequente para fetchActiveUsers');
        return activeUsers;
      }
      
      setLastFetchTime(now);
      console.log('Buscando usuários ativos para o navegador. Browser ID:', browserId);
      const activeUsersRef = collection(db, 'ActiveSellers');
      const q = query(activeUsersRef, where('browserId', '==', browserId));
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          docId: doc.id,
          ...doc.data()
        });
      });
      
      // Remover registros duplicados após busca
      // Agrupar por UID para remover duplicatas, mantendo apenas o mais recente
      const uniqueUsers = [];
      const userMap = new Map();
      
      users.forEach(user => {
        if (!userMap.has(user.uid) || new Date(user.timestamp.toDate()) > new Date(userMap.get(user.uid).timestamp.toDate())) {
          userMap.set(user.uid, user);
        }
      });
      
      // Converter o Map de volta para array
      userMap.forEach(user => uniqueUsers.push(user));
      
      console.log(`Usuários ativos neste navegador (após limpeza): ${uniqueUsers.length}`, uniqueUsers);
      setActiveUsers(uniqueUsers);
      
      // Remover duplicatas do Firebase
      if (users.length > uniqueUsers.length) {
        cleanupDuplicateUsers(users, uniqueUsers);
      }
      
      return uniqueUsers;
    } catch (error) {
      console.error('Error fetching active users:', error);
      return activeUsers || []; // Retorna o valor atual se houver erro
    }
  };

  // Remover registros duplicados
  const cleanupDuplicateUsers = async (allUsers, uniqueUsers) => {
    try {
      const uniqueIds = new Set(uniqueUsers.map(user => user.docId));
      const duplicates = allUsers.filter(user => !uniqueIds.has(user.docId));
      
      for (const duplicate of duplicates) {
        console.log(`Removendo usuário duplicado: ${duplicate.displayName}`);
        await deleteDoc(doc(db, 'ActiveSellers', duplicate.docId));
      }
    } catch (error) {
      console.error('Erro ao limpar usuários duplicados:', error);
    }
  };

  // Add user to active sellers
  const addToActiveSellers = async (userData) => {
    try {
      // Primeiro, verificar se este usuário já está ativo neste navegador
      const activeUsersRef = collection(db, 'ActiveSellers');
      const q = query(
        activeUsersRef,
        where('uid', '==', userData.uid),
        where('browserId', '==', browserId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Se já existe um registro para este usuário no navegador atual, não adicionar novamente
      if (!querySnapshot.empty) {
        console.log(`Usuário ${userData.displayName} já está ativo neste navegador.`);
        
        // Atualizar o registro existente com timestamp atual
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'ActiveSellers', existingDoc.id), {
          timestamp: new Date()
        });
        
        await fetchActiveUsers(); // Atualizar a lista mesmo assim
        return;
      }
      
      const activeSellerData = {
        uid: userData.uid,
        displayName: userData.displayName,
        unit: userData.unit,
        email: userData.email,
        role: userData.role,
        browserId: browserId,
        timestamp: new Date()
      };
      
      await addDoc(collection(db, 'ActiveSellers'), activeSellerData);
      await fetchActiveUsers();
    } catch (error) {
      console.error('Error adding active user:', error);
    }
  };

  // Remove user from active sellers
  const removeFromActiveSellers = async (uid) => {
    try {
      const activeUsersRef = collection(db, 'ActiveSellers');
      const q = query(
        activeUsersRef, 
        where('uid', '==', uid), 
        where('browserId', '==', browserId)
      );
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'ActiveSellers', document.id));
      });
      
      await fetchActiveUsers();
    } catch (error) {
      console.error('Error removing active user:', error);
    }
  };

  // Limpar registros antigos de usuários ativos (mais de 12 horas)
  const cleanupStaleUsers = async () => {
    try {
      const activeUsersRef = collection(db, 'ActiveSellers');
      const now = new Date();
      // 12 horas em milissegundos
      const staleTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      
      const q = query(activeUsersRef, where('timestamp', '<', staleTime));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        console.log('Removendo registro antigo:', document.id);
        await deleteDoc(doc(db, 'ActiveSellers', document.id));
      });
    } catch (error) {
      console.error('Erro ao limpar registros antigos:', error);
    }
  };

  // Fetch pharmacy units
  const fetchUnits = async () => {
    try {
      const unitsCollectionRef = collection(db, 'pharmacyUnits');
      const querySnapshot = await getDocs(unitsCollectionRef);
      const fetchedUnits = [];
      querySnapshot.forEach((doc) => {
        // Use doc.id as the value
        fetchedUnits.push(doc.id);
      });
      console.log("Unidades buscadas (IDs):", fetchedUnits);
      setUnits(fetchedUnits);
    } catch (error) {
      console.error('Error fetching pharmacy units:', error);
      setUnits([]); // Set to empty array on error
    }
  };

  useEffect(() => {
    let unsubscribe;
    console.log("AuthContext: useEffect started."); // Log start

    const authSubscription = onAuthStateChanged(auth, async (authUser) => {
      console.log("AuthContext: onAuthStateChanged triggered. authUser:", authUser ? authUser.uid : null); // Log auth state change
      try {
        if (authUser) {
          console.log("AuthContext: User found, setting up snapshot listener for UID:", authUser.uid);
          // Wrap snapshot logic in its own try/catch for more specific error logging
          try {
            unsubscribe = onSnapshot(doc(db, 'users', authUser.uid), async (docSnapshot) => {
              console.log("AuthContext: User snapshot received. Exists:", docSnapshot.exists());
              if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                console.log("AuthContext: User data:", { role: userData.role, unit: userData.unit });
                if (userData.role === 'admin' || userData.role === 'attendant' || userData.role === 'manager') {
                  const userWithData = {
                    uid: authUser.uid,
                    ...userData,
                    updatedAt: userData.updatedAt?.toDate()
                  };
                  setUser(userWithData);
                  console.log("AuthContext: User state set. Attempting to add to active sellers.");
                  await addToActiveSellers(userWithData);
                  console.log("AuthContext: Added to active sellers successfully.");
                } else {
                  console.log("AuthContext: User role not permitted. Signing out.");
                  await firebaseSignOut(auth);
                  setUser(null);
                }
              } else {
                console.log("AuthContext: User document does not exist. Signing out.");
                await firebaseSignOut(auth);
                setUser(null);
              }
            }, (snapshotError) => { // Add error handler for onSnapshot
              console.error("AuthContext: Error in onSnapshot listener:", snapshotError);
              // Optionally sign out or set user to null on snapshot error
              setUser(null);
            });
          } catch (snapshotSetupError) {
            console.error("AuthContext: Error setting up snapshot listener:", snapshotSetupError);
            setUser(null); // Ensure user is null if setup fails
          }
        } else {
          console.log("AuthContext: No authenticated user found.");
          setUser(null);
          setShowUnitSelection(false);
        }
      } catch (error) {
        // This catches errors in the main async logic of onAuthStateChanged (e.g., firebaseSignOut, addToActiveSellers)
        console.error('AuthContext: Error processing authentication state change:', error);
        setUser(null);
      } finally {
        console.log("AuthContext: Setting loading to false.");
        setLoading(false);
      }
    }, (authError) => { // Add error handler for onAuthStateChanged itself
        console.error("AuthContext: Error in onAuthStateChanged:", authError);
        setUser(null);
        setLoading(false); // Ensure loading is false even if auth listener fails
    });

    // Fetch active users and units on component mount
    console.log("AuthContext: Initializing fetches for active users and units.");
    Promise.allSettled([ // Use Promise.allSettled to catch errors from initial fetches
      activeUsers.length === 0 ? fetchActiveUsers() : Promise.resolve(),
      units.length === 0 ? fetchUnits() : Promise.resolve(),
      cleanupStaleUsers()
    ]).then(results => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const fetchName = index === 0 ? 'fetchActiveUsers' : index === 1 ? 'fetchUnits' : 'cleanupStaleUsers';
          console.error(`AuthContext: Error during initial ${fetchName}:`, result.reason);
        }
      });
      console.log("AuthContext: Initial fetches completed (or attempted).");
    });

    return () => {
      console.log("AuthContext: useEffect cleanup. Unsubscribing auth listener.");
      authSubscription();
      if (unsubscribe) {
        console.log("AuthContext: Unsubscribing snapshot listener.");
        unsubscribe();
      }
    };
  }, []); // Keep dependencies empty for mount logic

  const updateUserUnit = async (uid, newUnit) => {
    try {
      // Verifique se estamos atualizando o usuário pendente
      const isUpdatingPendingUser = pendingUser && uid === pendingUser.uid;
      console.log("Atualizando unidade para:", isUpdatingPendingUser ? "NOVO usuário" : "usuário atual");
      
      // Usuário que está sendo atualizado
      const targetUid = isUpdatingPendingUser ? pendingUser.uid : uid;
      const userRef = doc(db, 'users', targetUid);
      
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();
      
      // Atualize a unidade no Firestore
      await updateDoc(userRef, {
        originalUnit: userData.originalUnit || userData.unit,
        unit: newUnit
      });
      
      if (isUpdatingPendingUser) {
        // Se for o pendingUser, complete o processo de login
        console.log("Finalizando login com unidade:", newUnit);
        
        // Atualizar o pendingUser com a nova unidade
        const updatedPendingUser = {
          ...pendingUser,
          unit: newUnit,
          originalUnit: userData.originalUnit || userData.unit
        };
        
        // Adicionar aos usuários ativos
        await addToActiveSellers(updatedPendingUser);
        
        // Limpar o usuário pendente
        setPendingUser(null);
      } else if (user && user.uid === uid) {
        // Atualizar o usuário atual localmente
        setUser(prev => ({
          ...prev,
          unit: newUnit,
          originalUnit: userData.originalUnit || userData.unit
        }));
        
        // Atualizar também na coleção ActiveSellers
        const activeUsersRef = collection(db, 'ActiveSellers');
        const q = query(
          activeUsersRef,
          where('uid', '==', uid),
          where('browserId', '==', browserId)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { unit: newUnit });
        });
      }
      
      console.log(`Unidade atualizada com sucesso para: ${newUnit}`);
      setShowUnitSelection(false);
      
      return newUnit;
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user.uid);
      
      if (!userData) {
        throw new Error('Usuário sem permissão ou não encontrado');
      }
      
      // Verificar o perfil do usuário:
      // - Atendentes precisam selecionar unidade
      // - Gerentes e Admins entram diretamente com sua unidade padrão
      if (userData.role === 'attendant') {
        // Para atendentes, armazenar como pendingUser e mostrar seleção de unidade
        console.log("Atendente - Armazenando usuário temporário:", userData);
        setPendingUser(userData);
        setShowUnitSelection(true);
      } else {
        // Para gerentes e admins, fazer login direto sem seleção de unidade
        console.log("Gerente/Admin - Login direto sem seleção de unidade:", userData);
        setUser(userData);
        await addToActiveSellers(userData);
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (user?.originalUnit) {
        await updateDoc(doc(db, 'users', user.uid), {
          unit: user.originalUnit,
          originalUnit: null
        });
      }
      
      // Remove from active sellers
      await removeFromActiveSellers(user.uid);
      
      const remainingUsers = activeUsers.filter(u => u.uid !== user.uid);
      
      if (remainingUsers.length > 0) {
        // Switch to another active user instead of fully logging out
        const nextUser = await fetchUserData(remainingUsers[0].uid);
        setUser(nextUser);
      } else {
        // If no other active users, fully log out
        await firebaseSignOut(auth);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  // Switch to a specific active user
  const switchToUser = async (uid) => {
    try {
      const targetUser = await fetchUserData(uid);
      if (targetUser) {
        setUser(targetUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error switching user:', error);
      return false;
    }
  };

  // Check if there are any active users
  const hasActiveUsers = () => activeUsers.length > 0;

  const value = {
    user,
    pendingUser,
    signIn,
    signOut,
    updateUserUnit,
    showUnitSelection,
    setShowUnitSelection,
    loading,
    activeUsers,
    units, // Expose units in context value
    switchToUser,
    hasActiveUsers,
    fetchActiveUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};