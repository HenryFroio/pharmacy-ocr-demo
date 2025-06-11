// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UnitSelectionModal from '../components/UnitSelectionModal';
import { ArrowLeft, Users } from 'lucide-react';

const colors = {
  primary: '#e41c26',
  primaryLight: '#ff4d54',
  primaryDark: '#b81219',
  secondary: '#ff6b00',
  secondaryLight: '#ff8533',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  text: '#2D3748',
  textLight: '#718096',
  border: '#E2E8F0',
  shadow: '#000',
  white: 'white'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    signIn, updateUserUnit, user, pendingUser, showUnitSelection, 
    setShowUnitSelection, activeUsers, fetchActiveUsers 
  } = useAuth();

  // Checar se estamos adicionando um novo usuário
  const isAddingUser = new URLSearchParams(location.search).get('addUser') === 'true';
  
  // Apenas um useEffect para carregar os usuários ativos uma vez
  useEffect(() => {
    const loadActiveUsers = async () => {
      try {
        setLoadingUsers(true);
        await fetchActiveUsers();
        console.log("Usuários carregados apenas uma vez");
      } catch (error) {
        console.error("Erro ao carregar usuários ativos:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadActiveUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar efetivamente se há usuários ativos
  const hasAnyActiveUser = Array.isArray(activeUsers) && activeUsers.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userData = await signIn(email, password);
      
      // Se não for necessário selecionar unidade (gerentes/admins), redirecionar imediatamente
      // Se for necessário selecionar unidade (atendentes), o redirecionamento ocorrerá após a seleção
      if (userData.role !== 'attendant') {
        navigate('/balcao');
      }
    } catch (error) {
      setError(
        error.code === 'auth/invalid-credential'
          ? 'Email ou senha incorretos'
          : 'Erro ao fazer login. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnitConfirmation = (unit) => {
    // Use o pendingUser se estiver disponível, caso contrário use o user
    const targetUser = pendingUser || user;
    
    // Passar a unidade atual ao confirmar
    updateUserUnit(targetUser.uid, unit || targetUser.unit).then(() => {
      setShowUnitSelection(false);
      navigate('/balcao');
    }).catch(error => {
      console.error('Erro ao confirmar unidade:', error);
      setError('Erro ao confirmar unidade. Tente novamente.');
    });
  };

  const handleUnitSelection = async (newUnit) => {
    try {
      // Use o pendingUser se estiver disponível, caso contrário use o user
      const targetUser = pendingUser || user;
      
      console.log("Atualizando unidade para:", targetUser?.displayName);
      await updateUserUnit(targetUser.uid, newUnit);
      setShowUnitSelection(false);
      // Recarregar para garantir que as mudanças foram aplicadas
      window.location.href = '/balcao';
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      setError('Erro ao selecionar unidade. Tente novamente.');
    }
  };

  const handleReturnToCounter = () => {
    navigate('/balcao');
  };

  // Exibir informações para debug
  console.log('Estado do Login:', {
    activeUsers,
    activeUsersCount: activeUsers?.length || 0,
    isAddingUser,
    loadingUsers
  });

  // Garantir que temos uma verificação robusta para exibir o botão
  const shouldShowReturnButton = Array.isArray(activeUsers) && activeUsers.length > 0;

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
        {/* Badge de usuários ativos - movido para o topo */}
        {shouldShowReturnButton && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
              <Users size={16} className="mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {activeUsers.length === 1 
                  ? '1 usuário ativo' 
                  : `${activeUsers.length} usuários ativos`}
              </span>
            </div>
          </div>
        )}
        
        {/* Indicador de carregamento */}
        {loadingUsers && !shouldShowReturnButton && (
          <div className="mb-4 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
            Verificando usuários ativos...
          </div>
        )}
        
        <div className="max-w-md w-full m-4">
          <div className="bg-white rounded-lg shadow-lg p-8" style={{ backgroundColor: colors.cardBackground }}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-center" style={{ color: colors.primary }}>
                {isAddingUser ? 'Adicionar Usuário' : 'Login - FARMANOSSA'}
              </h2>
              
              {isAddingUser && shouldShowReturnButton && (
                <p className="text-center mt-2 text-gray-600">
                  Você continuará logado com os usuários atuais
                </p>
              )}
            </div>
            
            {error && (
              <div className="mb-6 p-4 rounded-md border border-red-300" style={{ backgroundColor: '#FEE2E2', color: colors.primary }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium" style={{ color: colors.text }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md shadow-sm transition-colors border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  style={{
                    padding: '0.75rem',
                    borderWidth: '1px',
                  }}
                  placeholder="seu.email@farmanossa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium" style={{ color: colors.text }}>
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md shadow-sm transition-colors border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  style={{
                    padding: '0.75rem',
                    borderWidth: '1px',
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg transition-colors shadow-md font-medium text-lg"
                style={{
                  backgroundColor: loading 
                    ? colors.textLight 
                    : isAddingUser 
                      ? '#3B82F6' 
                      : colors.primary,
                  color: colors.white,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading 
                  ? 'Entrando...' 
                  : isAddingUser 
                    ? 'Adicionar Usuário' 
                    : 'Entrar'}
              </button>
            </form>
          </div>
          
          {/* BOTÃO DE VOLTAR AO BALCÃO */}
          {shouldShowReturnButton && (
            <div className="mt-6 text-center">
              <button
                onClick={handleReturnToCounter}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                {isAddingUser ? 'Cancelar e Voltar ao Balcão' : 'Voltar ao Balcão'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showUnitSelection && user && (
        <UnitSelectionModal
          currentUnit={user.unit}
          onConfirm={handleUnitConfirmation}
          onSelect={handleUnitSelection}
          onClose={() => setShowUnitSelection(false)}
        />
      )}
    </>
  );
};

export default Login;