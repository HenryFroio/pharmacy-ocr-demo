import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, ChevronDown, ChevronUp, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserSwitcher = () => {
  const { user, activeUsers, switchToUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to safely format display name
  const formatDisplayName = (displayName, firstNameOnly = false) => {
    if (!displayName) return 'Usuário';
    if (firstNameOnly) {
      return displayName.split(' ')[0] || 'Usuário';
    }
    return displayName;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserSwitch = async (uid) => {
    await switchToUser(uid);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleLogin = () => {
    // Adicionar parâmetro de consulta para indicar que estamos adicionando um novo usuário
    navigate('/login?addUser=true');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 shadow-sm transition-all duration-200"
      >
        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
          <User size={16} className="text-gray-600" />
        </div>        <span className="font-medium truncate max-w-[100px]">
          {user ? formatDisplayName(user.displayName, true) : 'Usuário'}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {user && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="font-semibold text-gray-800">{formatDisplayName(user.displayName)}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-xs font-medium mt-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full inline-block">
                {user.unit}
              </div>
            </div>
          )}
          
          {activeUsers.filter(u => u.uid !== user?.uid).length > 0 && (
            <div className="py-1">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Alternar usuário
              </h3>
              {activeUsers.filter(u => u.uid !== user?.uid).map((activeUser) => (
                <button
                  key={activeUser.uid}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center"
                  onClick={() => handleUserSwitch(activeUser.uid)}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{formatDisplayName(activeUser.displayName)}</div>
                    <div className="text-xs text-gray-600">Unidade: {activeUser.unit}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="border-t border-gray-200 py-1">
            <button
              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center text-blue-600"
              onClick={handleLogin}
            >
              <UserPlus size={18} className="mr-3" />
              <span className="font-medium">Adicionar Usuário</span>
            </button>

            {/* Botão de logout só aparece se houver um usuário logado */}
            {user && (
              <button
                className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center text-red-600"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-3" />
                <span className="font-medium">Sair ({formatDisplayName(user.displayName, true)})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSwitcher;
