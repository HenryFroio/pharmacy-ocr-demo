/**
 * Pharmacy OCR System - Main Application Component
 * 
 * © 2025 CSP COMERCIO DE MEDICAMENTOS LTDA. All rights reserved.
 * Developed by: Henry Matheus Froio
 * 
 * This software is proprietary and confidential.
 * Licensed for portfolio demonstration purposes only.
 */

// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ImageDataExtractor from './components/ImageDataExtractor';

// Loader component
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#e41c26] border-t-transparent"></div>
  </div>
);

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
  const { user, loading, showUnitSelection } = useAuth();
  
  if (loading) {
    return <Loader />;
  }

  // Se o usuário está autenticado mas ainda precisa selecionar a unidade,
  // redireciona para o login onde o modal de seleção será mostrado
  if (user && showUnitSelection) {
    return <Navigate to="/login" />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Componente principal com background e padding
const MainContainer = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4">
      <ImageDataExtractor />
    </div>
  );
};

// Componente para rotas públicas
const PublicRoute = ({ children }) => {
  const { user, loading, showUnitSelection, activeUsers } = useAuth();
  
  // Verificar se estamos no modo de adicionar novo usuário
  const isAddingUser = new URLSearchParams(window.location.search).get('addUser') === 'true';
  
  // Verificação para usuários ativos
  const hasActiveUsers = activeUsers && activeUsers.length > 0;

  if (loading) {
    return <Loader />;
  }

  // Se o usuário está autenticado mas precisa selecionar unidade,
  // permite que continue na página de login
  if (user && showUnitSelection) {
    return children;
  }

  // Se estamos tentando adicionar um novo usuário, sempre mostra a página de login
  if (isAddingUser) {
    return children;
  }

  // NOVA LÓGICA: Se há usuários ativos E não estamos tentando adicionar um usuário,
  // redirecionar para o balcão
  if (hasActiveUsers) {
    return <Navigate to="/balcao" />;
  }

  // Se não há nenhum usuário ativo, mostra a página de login normalmente
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route
            path="/balcao"
            element={
              <PrivateRoute>
                <MainContainer />
              </PrivateRoute>
            }
          />
          {/* Redirecionar outras rotas para a página inicial */}
          <Route path="*" element={<Navigate to="/balcao" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;