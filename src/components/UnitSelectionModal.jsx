// src/components/UnitSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

const UnitSelectionModal = ({ currentUnit, onConfirm, onSelect, onClose }) => {
  const { pendingUser } = useAuth();
  const [showUnitList, setShowUnitList] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Usar a unidade do pendingUser se disponível, caso contrário usar currentUnit
  const effectiveCurrentUnit = pendingUser?.unit || currentUnit;

  // Adicionar título específico para atendentes
  const modalTitle = "Selecionar Unidade de Trabalho";

  // Inicializar com a unidade correta
  useEffect(() => {
    setSelectedUnit(effectiveCurrentUnit);
  }, [effectiveCurrentUnit]);

  const units = Array.from({ length: 15 }, (_, i) => ({
    id: `FARMANOSSA F${String(i + 1).padStart(2, '0')}`,
    shortId: `F${String(i + 1).padStart(2, '0')}`
  }));

  const handleUnitSelect = (unitId) => {
    setSelectedUnit(unitId);
  };

  const handleConfirmNewUnit = () => {
    if (selectedUnit) {
      onSelect(selectedUnit);
    }
    setShowUnitList(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        {!showUnitList ? (
          <>
            <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.text }}>
              {modalTitle}
            </h2>
            <p className="text-gray-600 mb-3 text-center" style={{ color: colors.textLight }}>
              {pendingUser && <span>Olá, {pendingUser.displayName}. </span>}
              Deseja trabalhar em sua unidade padrão?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-center font-medium" style={{ color: colors.text }}>
                Sua unidade padrão é:
              </p>
              <p className="text-xl font-bold text-center mt-2" style={{ color: colors.primary }}>
                {effectiveCurrentUnit}
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  onConfirm(effectiveCurrentUnit);
                }}
                className="w-full py-2 px-4 rounded transition-colors"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.white,
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = colors.primaryLight}
                onMouseOut={e => e.currentTarget.style.backgroundColor = colors.primary}
              >
                Confirmar Unidade Atual
              </button>
              <button
                onClick={() => setShowUnitList(true)}
                className="w-full py-2 px-4 rounded transition-colors"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.white,
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = colors.secondaryLight}
                onMouseOut={e => e.currentTarget.style.backgroundColor = colors.secondary}
              >
                Selecionar Outra Unidade
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.text }}>
              Selecionar Nova Unidade
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => handleUnitSelect(unit.id)}
                  className="p-4 rounded text-center transition-colors"
                  style={{
                    backgroundColor: selectedUnit === unit.id ? colors.primary : colors.background,
                    color: selectedUnit === unit.id ? colors.white : colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {unit.shortId}
                </button>
              ))}
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowUnitList(false)}
                className="w-1/2 py-2 px-4 rounded transition-colors"
                style={{
                  backgroundColor: colors.textLight,
                  color: colors.white,
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = colors.text}
                onMouseOut={e => e.currentTarget.style.backgroundColor = colors.textLight}
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmNewUnit}
                disabled={!selectedUnit}
                className="w-1/2 py-2 px-4 rounded transition-colors"
                style={{
                  backgroundColor: selectedUnit ? colors.primary : colors.textLight,
                  color: colors.white,
                  cursor: selectedUnit ? 'pointer' : 'not-allowed',
                }}
                onMouseOver={e => {
                  if (selectedUnit) e.currentTarget.style.backgroundColor = colors.primaryLight;
                }}
                onMouseOut={e => {
                  if (selectedUnit) e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                Confirmar Unidade
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UnitSelectionModal;